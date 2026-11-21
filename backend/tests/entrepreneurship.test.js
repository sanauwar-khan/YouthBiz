import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import InventoryMovement from "../src/models/InventoryMovement.js";
import BusinessPitch from "../src/models/BusinessPitch.js";

const hasTestConfiguration = Boolean(process.env.MONGODB_URI && process.env.JWT_SECRET);
const testEmailPrefix = `entrepreneurship-test-${randomUUID()}`;
const studentIds = [];
let server;
let apiBase;
let studentA;
let studentB;
let productA;
let productB;
let pitchA;

async function createStudent(label) {
  const user = await User.create({
    firstName: label,
    lastName: "Test",
    email: `${testEmailPrefix}-${label.toLowerCase()}@example.invalid`,
    ageGroup: "13-17",
    passwordHash: randomBytes(32).toString("hex"),
  });
  studentIds.push(user._id);

  const csrfResponse = await fetch(`${apiBase}/auth/csrf`, {
    headers: { Origin: "http://localhost:3001" },
  });
  const csrfData = await csrfResponse.json();
  const csrfCookie = (csrfResponse.headers.get("set-cookie") || "").match(/youthbiz_csrf=([^;]+)/)?.[1];

  return {
    id: user._id.toString(),
    csrfToken: csrfData.csrfToken,
    cookie: `youthbiz_session=${jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "10m" })}; youthbiz_csrf=${csrfCookie}`,
  };
}

async function apiRequest(student, path, { method = "GET", body } = {}) {
  const headers = {
    Accept: "application/json",
    Cookie: student.cookie,
    Origin: "http://localhost:3001",
  };
  if (method !== "GET") headers["X-CSRF-Token"] = student.csrfToken;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await response.json() };
}

function productPayload(overrides = {}) {
  return {
    name: "Test Bookmarks",
    description: "Handmade card bookmarks",
    category: "stationery",
    materials: [{ name: "Cardstock", quantity: 1, unit: "sheet" }],
    unitCost: 2.5,
    sellingPrice: 7.5,
    initialProductionQuantity: 3,
    ...overrides,
  };
}

if (!hasTestConfiguration) {
  test("entrepreneurship integration tests require MONGODB_URI and JWT_SECRET", { skip: true }, () => {});
} else {
  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    server = app.listen(0);
    await once(server, "listening");
    apiBase = `http://127.0.0.1:${server.address().port}/api`;
    studentA = await createStudent("StudentA");
    studentB = await createStudent("StudentB");
  });

  after(async () => {
    if (studentIds.length > 0 && mongoose.connection.readyState === 1) {
      await Promise.all([
        Product.deleteMany({ studentId: { $in: studentIds } }),
        InventoryMovement.deleteMany({ studentId: { $in: studentIds } }),
        BusinessPitch.deleteMany({ studentId: { $in: studentIds } }),
        User.deleteMany({ _id: { $in: studentIds } }),
      ]);
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

  test("products are student-owned, editable, and archived without deleting stock history", async () => {
    const created = await apiRequest(studentA, "/products", { method: "POST", body: productPayload() });
    assert.equal(created.response.status, 201);
    productA = created.data.product;
    assert.equal(productA.initialProductionQuantity, 3);
    assert.equal(productA.availableStock, 3);

    const listedA = await apiRequest(studentA, "/products");
    const listedB = await apiRequest(studentB, "/products");
    assert.equal(listedA.data.products.length, 1);
    assert.equal(listedB.data.products.length, 0);

    const hidden = await apiRequest(studentB, `/products/${productA.id}`);
    assert.equal(hidden.response.status, 404);

    const updated = await apiRequest(studentA, `/products/${productA.id}`, {
      method: "PATCH",
      body: { name: "Updated Bookmarks", sellingPrice: 8 },
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.product.name, "Updated Bookmarks");

    const blockedUpdate = await apiRequest(studentB, `/products/${productA.id}`, {
      method: "PATCH",
      body: { name: "Not yours" },
    });
    assert.equal(blockedUpdate.response.status, 404);

    const studentBProduct = await apiRequest(studentB, "/products", {
      method: "POST",
      body: productPayload({ name: "Student B Product", initialProductionQuantity: 0 }),
    });
    assert.equal(studentBProduct.response.status, 201);
    productB = studentBProduct.data.product;
  });

  test("inventory movements preserve history, reject overselling, and serialize concurrent sales", async () => {
    const initialHistory = await apiRequest(studentA, `/inventory/${productA.id}/movements`);
    assert.equal(initialHistory.response.status, 200);
    assert.equal(initialHistory.data.movements.length, 1);
    assert.equal(initialHistory.data.movements[0].type, "production");

    const production = await apiRequest(studentA, `/inventory/${productA.id}/production`, {
      method: "POST",
      body: { quantity: 2, notes: "Second batch" },
    });
    assert.equal(production.response.status, 201);
    assert.equal(production.data.product.totalProduced, 5);
    assert.equal(production.data.product.availableStock, 5);

    const firstSale = await apiRequest(studentA, `/inventory/${productA.id}/sales`, {
      method: "POST",
      body: { quantity: 4, notes: "School fair" },
    });
    assert.equal(firstSale.response.status, 201);
    assert.equal(firstSale.data.product.availableStock, 1);

    const oversell = await apiRequest(studentA, `/inventory/${productA.id}/sales`, {
      method: "POST",
      body: { quantity: 2 },
    });
    assert.equal(oversell.response.status, 409);

    const concurrentSales = await Promise.all([
      apiRequest(studentA, `/inventory/${productA.id}/sales`, { method: "POST", body: { quantity: 1 } }),
      apiRequest(studentA, `/inventory/${productA.id}/sales`, { method: "POST", body: { quantity: 1 } }),
    ]);
    assert.deepEqual(concurrentSales.map((item) => item.response.status).sort(), [201, 409]);

    const finalInventory = await apiRequest(studentA, "/inventory");
    const finalProduct = finalInventory.data.products.find((item) => item.id === productA.id);
    assert.equal(finalProduct.totalProduced, 5);
    assert.equal(finalProduct.totalSold, 5);
    assert.equal(finalProduct.availableStock, 0);
    assert.equal(finalProduct.isLowStock, true);

    const hiddenSale = await apiRequest(studentB, `/inventory/${productA.id}/sales`, {
      method: "POST",
      body: { quantity: 1 },
    });
    assert.equal(hiddenSale.response.status, 404);

    const archived = await apiRequest(studentA, `/products/${productA.id}/archive`, { method: "PATCH", body: {} });
    assert.equal(archived.response.status, 200);
    const activeInventory = await apiRequest(studentA, "/inventory");
    assert.equal(activeInventory.data.products.some((item) => item.id === productA.id), false);
    const preservedHistory = await apiRequest(studentA, `/inventory/${productA.id}/movements`);
    assert.equal(preservedHistory.data.movements.length, 4);
  });

  test("pitches snapshot owned products, calculate estimates, and remain proposed", async () => {
    const activeProduct = await apiRequest(studentA, "/products", {
      method: "POST",
      body: productPayload({ name: "Pitch Bookmarks", initialProductionQuantity: 0 }),
    });
    assert.equal(activeProduct.response.status, 201);
    const pitchProductId = activeProduct.data.product.id;

    const createPitch = (student, productId, overrides = {}) => apiRequest(student, "/pitches", {
      method: "POST",
      body: {
        businessName: "Bookmark Bar",
        description: "Personalized bookmarks for readers",
        products: [{ productId, proposedPrice: 10, expectedQuantity: 5 }],
        targetCustomers: "Students and teachers",
        uniqueValue: "Custom names and art",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        eventLocation: "School pop-up table",
        ...overrides,
      },
    });

    const invalidProduct = await createPitch(studentA, productB.id);
    assert.equal(invalidProduct.response.status, 400);

    const created = await createPitch(studentA, pitchProductId);
    assert.equal(created.response.status, 201);
    pitchA = created.data.pitch;
    assert.equal(pitchA.estimatedRevenue, 50);
    assert.equal(pitchA.estimatedCosts, 12.5);
    assert.equal(pitchA.estimatedProfit, 37.5);
    assert.equal(pitchA.eventStatus, "proposed");
    assert.equal(pitchA.products[0].productName, "Pitch Bookmarks");

    const updated = await apiRequest(studentA, `/pitches/${pitchA.id}`, {
      method: "PATCH",
      body: {
        businessName: "Bookmark Pop-up",
        description: "Updated plan",
        products: [{ productId: pitchProductId, proposedPrice: 12, expectedQuantity: 6 }],
        targetCustomers: "Readers",
        uniqueValue: "Handmade designs",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        eventLocation: "Community center",
      },
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.pitch.estimatedRevenue, 72);
    assert.equal(updated.data.pitch.estimatedCosts, 15);
    assert.equal(updated.data.pitch.estimatedProfit, 57);
    assert.equal(updated.data.pitch.eventStatus, "proposed");

    const hiddenPitch = await apiRequest(studentB, `/pitches/${pitchA.id}`);
    assert.equal(hiddenPitch.response.status, 404);
    const blockedUpdate = await apiRequest(studentB, `/pitches/${pitchA.id}`, {
      method: "PATCH",
      body: {
        businessName: "Not yours",
        description: "No access",
        products: [{ productId: productB.id, proposedPrice: 1, expectedQuantity: 1 }],
        targetCustomers: "No access",
        uniqueValue: "No access",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        eventLocation: "Nowhere",
      },
    });
    assert.equal(blockedUpdate.response.status, 404);

    const archived = await apiRequest(studentA, `/pitches/${pitchA.id}/archive`, { method: "PATCH", body: {} });
    assert.equal(archived.response.status, 200);
    assert.equal(archived.data.pitch.isArchived, true);
    const activePitches = await apiRequest(studentA, "/pitches");
    assert.equal(activePitches.data.pitches.length, 0);
    const allPitches = await apiRequest(studentA, "/pitches?includeArchived=true");
    assert.equal(allPitches.data.pitches.length, 1);
  });

  test("same-day date-only pitches save, report date errors, and appear in saved pitches", async () => {
    const lassiProduct = await apiRequest(studentA, "/products", {
      method: "POST",
      body: productPayload({ name: "Lassi", description: "Sweet and tasty", unitCost: 12, sellingPrice: 30 }),
    });
    assert.equal(lassiProduct.response.status, 201);

    const eventDate = new Date().toISOString().slice(0, 10);
    const pitchPayload = {
      businessName: "Lassi House",
      description: "Sweet and tasty",
      products: [{ productId: lassiProduct.data.product.id, proposedPrice: 30, expectedQuantity: 15 }],
      targetCustomers: "local People",
      uniqueValue: "This Lassi is Different",
      eventDate,
      eventLocation: "village Fair",
    };

    const created = await apiRequest(studentA, "/pitches", { method: "POST", body: pitchPayload });
    assert.equal(created.response.status, 201, JSON.stringify(created.data));
    assert.equal(created.data.pitch.estimatedRevenue, 450);
    assert.equal(created.data.pitch.estimatedCosts, 180);
    assert.equal(created.data.pitch.estimatedProfit, 270);

    const savedPitches = await apiRequest(studentA, "/pitches");
    assert.equal(savedPitches.response.status, 200);
    assert.ok(savedPitches.data.pitches.some((pitch) => pitch.businessName === "Lassi House"));

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const invalidDate = await apiRequest(studentA, "/pitches", {
      method: "POST",
      body: { ...pitchPayload, businessName: "Expired pitch", eventDate: yesterday },
    });
    assert.equal(invalidDate.response.status, 400);
    assert.match(invalidDate.data.fieldErrors.eventDate, /today or later/i);
  });
}
