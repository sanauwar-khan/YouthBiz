import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app.js";
import Admin from "../src/models/Admin.js";
import BusinessPitch from "../src/models/BusinessPitch.js";
import InventoryMovement from "../src/models/InventoryMovement.js";
import PRD from "../src/models/PRD.js";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";

const canRun = Boolean(process.env.MONGODB_URI && process.env.JWT_SECRET);
const suffix = randomUUID();
const created = { adminIds: [], userIds: [], productIds: [], pitchIds: [], movementIds: [], prdIds: [] };
let server;
let apiBase;
let admin;
let student;
let csrfToken;
let csrfCookie;
let adminCookie;
let studentCookie;
let product;
let adminPassword;

async function request(path, { method = "GET", body, cookie = adminCookie, csrf = true } = {}) {
  const headers = { Accept: "application/json", Origin: "http://localhost:3001" };
  if (cookie) headers.Cookie = cookie;
  if (csrf && method !== "GET") headers["X-CSRF-Token"] = csrfToken;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(apiBase + path, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await response.json().catch(() => ({})) };
}

function cookieValue(header, name) {
  return String(header || "").match(new RegExp(name + "=([^;]+)"))?.[1];
}

if (!canRun) {
  test("admin integration tests require MONGODB_URI and JWT_SECRET", { skip: true }, () => {});
} else {
  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    server = app.listen(0);
    await once(server, "listening");
    apiBase = `http://127.0.0.1:${server.address().port}/api`;

    adminPassword = randomBytes(32).toString("base64url");
    admin = await Admin.create({
      email: `admin-test-${suffix}@example.invalid`,
      passwordHash: await bcrypt.hash(adminPassword, 4),
    });
    created.adminIds.push(admin._id);
    student = await User.create({
      firstName: "AdminTest",
      lastName: "Student",
      email: `admin-student-${suffix}@example.invalid`,
      ageGroup: "13-17",
      passwordHash: randomBytes(32).toString("hex"),
    });
    created.userIds.push(student._id);
    product = await Product.create({
      studentId: student._id,
      name: "Admin Audit Product",
      description: "Test product",
      category: "stationery",
      materials: [],
      unitCost: 2,
      sellingPrice: 5,
      initialProductionQuantity: 4,
      totalProduced: 4,
      totalSold: 1,
    });
    created.productIds.push(product._id);
    const movement = await InventoryMovement.create({
      studentId: student._id,
      productId: product._id,
      type: "production",
      quantity: 4,
      unitCost: 2,
    });
    created.movementIds.push(movement._id);
    const pitch = await BusinessPitch.create({
      studentId: student._id,
      businessName: "Admin Test Pitch",
      description: "A test pitch",
      products: [{ productId: product._id, productName: product.name, proposedPrice: 5, unitCostSnapshot: 2, expectedQuantity: 3 }],
      targetCustomers: "Readers",
      uniqueValue: "Handmade",
      eventDate: new Date(Date.now() + 86400000),
      eventLocation: "School fair",
      estimatedRevenue: 15,
      estimatedCosts: 6,
      estimatedProfit: 9,
    });
    created.pitchIds.push(pitch._id);

    const csrfResponse = await fetch(`${apiBase}/auth/csrf`, { headers: { Origin: "http://localhost:3001" } });
    const csrfData = await csrfResponse.json();
    csrfToken = csrfData.csrfToken;
    csrfCookie = cookieValue(csrfResponse.headers.get("set-cookie"), "youthbiz_csrf");
    const token = jwt.sign(
      { sub: admin._id.toString(), role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "10m", issuer: "youthbiz-admin", audience: "youthbiz-admin" },
    );
    adminCookie = `youthbiz_admin_session=${token}; youthbiz_csrf=${csrfCookie}`;
    studentCookie = `youthbiz_session=${jwt.sign({ sub: student._id.toString() }, process.env.JWT_SECRET, { expiresIn: "10m" })}; youthbiz_csrf=${csrfCookie}`;
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      await Promise.all([
        PRD.deleteMany({ _id: { $in: created.prdIds } }),
        BusinessPitch.deleteMany({ _id: { $in: created.pitchIds } }),
        InventoryMovement.deleteMany({ _id: { $in: created.movementIds } }),
        Product.deleteMany({ _id: { $in: created.productIds } }),
        User.deleteMany({ _id: { $in: created.userIds } }),
        Admin.deleteMany({ _id: { $in: created.adminIds } }),
      ]);
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

  test("admin authentication is isolated from student sessions and has no public registration", async () => {
    const deniedDashboard = await request("/admin/dashboard", { cookie: "", csrf: false });
    assert.equal(deniedDashboard.response.status, 401);

    const deniedStudentSession = await request("/admin/dashboard", { cookie: studentCookie, csrf: false });
    assert.equal(deniedStudentSession.response.status, 401);

    const publicRegistration = await request("/admin/auth/register", { method: "POST", body: {}, cookie: "", csrf: false });
    assert.equal(publicRegistration.response.status, 401);

    const login = await request("/admin/auth/login", {
      method: "POST",
      cookie: `youthbiz_csrf=${csrfCookie}`,
      body: { email: admin.email, password: adminPassword },
    });
    assert.equal(login.response.status, 200);
    const token = cookieValue(login.response.headers.get("set-cookie"), "youthbiz_admin_session");
    assert.ok(token);
    const loginCookie = `youthbiz_admin_session=${token}; youthbiz_csrf=${csrfCookie}`;

    const me = await request("/admin/auth/me", { cookie: loginCookie });
    assert.equal(me.response.status, 200);
    assert.equal(me.data.admin.email, admin.email);
    assert.equal(Object.hasOwn(me.data.admin, "passwordHash"), false);

    const logout = await request("/admin/auth/logout", { method: "POST", cookie: loginCookie });
    assert.equal(logout.response.status, 200);
    assert.match(logout.response.headers.get("set-cookie") || "", /youthbiz_admin_session=;/);
  });

  test("configured backend Admin credentials can log in without duplicate accounts", async () => {
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredEmail || !configuredPassword) return;

    const login = await request("/admin/auth/login", {
      method: "POST",
      cookie: `youthbiz_csrf=${csrfCookie}`,
      body: { email: configuredEmail, password: configuredPassword },
    });
    assert.equal(login.response.status, 200);
    const token = cookieValue(login.response.headers.get("set-cookie"), "youthbiz_admin_session");
    assert.ok(token);
    const configuredCookie = `youthbiz_admin_session=${token}; youthbiz_csrf=${csrfCookie}`;
    const profile = await request("/admin/auth/me", { cookie: configuredCookie });
    assert.equal(profile.response.status, 200);
    assert.equal(profile.data.admin.email, configuredEmail);
    assert.equal(await Admin.countDocuments({ email: configuredEmail }), 1);
  });

  test("admin data APIs return safe student, product, inventory, pitch, and live stats", async () => {
    const dashboard = await request("/admin/dashboard");
    assert.equal(dashboard.response.status, 200);
    assert.ok(dashboard.data.stats.totalStudents >= 1);
    assert.ok(dashboard.data.stats.totalProducts >= 1);
    assert.ok(dashboard.data.stats.totalInventory >= 0);
    assert.ok(dashboard.data.stats.totalBusinessPitches >= 1);

    const students = await request(`/admin/students?q=${encodeURIComponent(student.firstName + " " + student.lastName)}`);
    assert.equal(students.response.status, 200);
    assert.equal(students.data.students[0].email, student.email);
    assert.equal(JSON.stringify(students.data).includes("passwordHash"), false);

    const studentDetails = await request(`/admin/students/${student._id}`);
    assert.equal(studentDetails.response.status, 200);
    assert.equal(studentDetails.data.products[0].availableStock, 3);
    assert.equal(studentDetails.data.inventoryHistory[0].productId, product._id.toString());

    const products = await request(`/admin/products?q=${encodeURIComponent(student.firstName + " " + student.lastName)}`);
    assert.equal(products.response.status, 200);
    assert.equal(products.data.products[0].student.email, student.email);
    const productDetail = await request(`/admin/products/${product._id}`);
    assert.equal(productDetail.response.status, 200);
    assert.equal(productDetail.data.movements.length, 1);

    const inventory = await request(`/admin/inventory?studentId=${student._id}&productId=${product._id}&lowStock=true`);
    assert.equal(inventory.response.status, 200);
    assert.equal(inventory.data.products[0].availableStock, 3);
    const movementHistory = await request(`/admin/inventory/${product._id}/movements`);
    assert.equal(movementHistory.data.movements.length, 1);

    const pitches = await request("/admin/business-pitches?q=Admin%20Test%20Pitch");
    assert.equal(pitches.response.status, 200);
    assert.equal(pitches.data.pitches[0].student.email, student.email);
    const pitchDetail = await request(`/admin/business-pitches/${created.pitchIds[0]}`);
    assert.equal(pitchDetail.response.status, 200);
    assert.equal(pitchDetail.data.pitch.estimatedProfit, 9);
  });

  test("admins can save, edit, publish, and delete PRDs", async () => {
    const draft = await request("/admin/prds", {
      method: "POST",
      body: { title: "YouthBiz test PRD", projectName: "YouthBiz", status: "draft" },
    });
    assert.equal(draft.response.status, 201);
    created.prdIds.push(draft.data.prd.id);
    assert.equal(draft.data.prd.status, "draft");
    assert.equal(draft.data.prd.createdBy.id, admin._id.toString());

    const incompletePublish = await request(`/admin/prds/${draft.data.prd.id}`, {
      method: "PUT",
      body: { title: "YouthBiz test PRD", projectName: "YouthBiz", status: "published" },
    });
    assert.equal(incompletePublish.response.status, 400);

    const published = await request(`/admin/prds/${draft.data.prd.id}`, {
      method: "PUT",
      body: {
        title: "YouthBiz requirements",
        projectName: "YouthBiz",
        overview: "A student entrepreneurship platform.",
        problemStatement: "Students need one place to plan and manage small businesses.",
        objectives: ["Help students manage products, stock, and pitches."],
        targetUsers: ["YouthBiz students", "YouthBiz administrators"],
        proposedSolutions: ["Provide one protected student workspace."],
        userStories: ["As a student, I want to manage products and inventory."],
        functionalRequirements: ["Student login", "Product management"],
        nonFunctionalRequirements: ["Protect student records"],
        rolePermissions: [{ role: "Admin", permissions: ["View student records"] }],
        featuresWorkflows: "Students create products, record stock, and prepare pitches.",
        acceptanceCriteria: ["Only an authenticated student can change their own products."],
        scope: ["Student product workspace"],
        outOfScope: ["Payments"],
        successMetrics: ["Active student-created products"],
        status: "published",
      },
    });
    assert.equal(published.response.status, 200);
    assert.equal(published.data.prd.status, "published");
    assert.equal(published.data.prd.title, "YouthBiz requirements");
    assert.equal(published.data.prd.createdBy.id, admin._id.toString());
    assert.ok(new Date(published.data.prd.updatedAt) >= new Date(draft.data.prd.updatedAt));

    const list = await request("/admin/prds");
    assert.ok(list.data.prds.some((item) => item.id === draft.data.prd.id));
    const deleted = await request(`/admin/prds/${draft.data.prd.id}`, { method: "DELETE" });
    assert.equal(deleted.response.status, 200);
    created.prdIds = created.prdIds.filter((id) => id.toString() !== draft.data.prd.id);
    const missing = await request(`/admin/prds/${draft.data.prd.id}`);
    assert.equal(missing.response.status, 404);
  });
}
