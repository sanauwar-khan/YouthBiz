import mongoose from "mongoose";
import BusinessPitch from "../models/BusinessPitch.js";
import InventoryMovement from "../models/InventoryMovement.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const defaultLimit = 25;
const maxLimit = 100;

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function safeRegex(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function paginationFrom(request) {
  const requestedPage = Number.parseInt(request.query.page, 10);
  const requestedLimit = Number.parseInt(request.query.limit, 10);
  return {
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    limit: Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, maxLimit) : defaultLimit,
  };
}

function paginationResult(page, limit, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}

function safeStudent(student) {
  return {
    id: student._id.toString(),
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    ageGroup: student.ageGroup,
    createdAt: student.createdAt,
  };
}

function safeOwner(student) {
  return student ? safeStudent(student) : null;
}

function studentSearchFilter(query) {
  const regex = safeRegex(query);
  const words = query.split(/\s+/).filter(Boolean).map(safeRegex);
  const terms = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  if (words.length > 1) {
    terms.push({ $and: words.map((word) => ({ $or: [{ firstName: word }, { lastName: word }] })) });
  }
  return { $or: terms };
}

function safeProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    category: product.category,
    materials: product.materials,
    unitCost: product.unitCost,
    sellingPrice: product.sellingPrice,
    initialProductionQuantity: product.initialProductionQuantity,
    totalProduced: product.totalProduced,
    totalSold: product.totalSold,
    availableStock: product.totalProduced - product.totalSold,
    isLowStock: product.totalProduced - product.totalSold <= 5,
    isArchived: product.isArchived,
    archivedAt: product.archivedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    student: safeOwner(product.studentId),
  };
}

function safeMovement(movement) {
  return {
    id: movement._id.toString(),
    productId: movement.productId.toString(),
    type: movement.type,
    quantity: movement.quantity,
    unitCost: movement.unitCost,
    unitPrice: movement.unitPrice,
    notes: movement.notes,
    createdAt: movement.createdAt,
  };
}

function safePitch(pitch) {
  return {
    id: pitch._id.toString(),
    businessName: pitch.businessName,
    description: pitch.description,
    products: pitch.products.map((line) => ({
      productId: line.productId.toString(),
      productName: line.productName,
      proposedPrice: line.proposedPrice,
      unitCostSnapshot: line.unitCostSnapshot,
      expectedQuantity: line.expectedQuantity,
    })),
    targetCustomers: pitch.targetCustomers,
    uniqueValue: pitch.uniqueValue,
    eventDate: pitch.eventDate,
    eventLocation: pitch.eventLocation,
    estimatedRevenue: pitch.estimatedRevenue,
    estimatedCosts: pitch.estimatedCosts,
    estimatedProfit: pitch.estimatedProfit,
    eventStatus: pitch.eventStatus,
    isArchived: pitch.isArchived,
    archivedAt: pitch.archivedAt,
    createdAt: pitch.createdAt,
    updatedAt: pitch.updatedAt,
    student: safeOwner(pitch.studentId),
  };
}

async function ownerIdsForSearch(query) {
  if (!query) return [];
  return User.find(studentSearchFilter(query)).distinct("_id");
}

function addArchiveFilter(filter, status) {
  if (status === "active") filter.isArchived = false;
  else if (status === "archived") filter.isArchived = true;
  else if (status && status !== "all") throw httpError(400, "Choose active, archived, or all.");
}

export async function getAdminDashboard(_request, response, next) {
  try {
    const [totalStudents, totalProducts, inventoryTotals, totalPitches, recentStudents, recentProducts, recentPitches] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.aggregate([
        { $match: { isArchived: { $ne: true } } },
        { $group: { _id: null, available: { $sum: { $subtract: ["$totalProduced", "$totalSold"] } }, produced: { $sum: "$totalProduced" }, sold: { $sum: "$totalSold" }, lowStock: { $sum: { $cond: [{ $lte: [{ $subtract: ["$totalProduced", "$totalSold"] }, 5] }, 1, 0] } } } },
      ]),
      BusinessPitch.countDocuments(),
      User.find().select("firstName lastName email ageGroup createdAt").sort({ createdAt: -1 }).limit(6),
      Product.find().sort({ createdAt: -1 }).limit(6).populate("studentId", "firstName lastName email ageGroup createdAt"),
      BusinessPitch.find().sort({ createdAt: -1 }).limit(6).populate("studentId", "firstName lastName email ageGroup createdAt"),
    ]);
    response.set("Cache-Control", "no-store");
    return response.json({
      stats: {
        totalStudents,
        totalProducts,
        totalInventory: inventoryTotals[0]?.available || 0,
        totalProduced: inventoryTotals[0]?.produced || 0,
        totalSold: inventoryTotals[0]?.sold || 0,
        lowStockProducts: inventoryTotals[0]?.lowStock || 0,
        totalBusinessPitches: totalPitches,
      },
      recentStudents: recentStudents.map(safeStudent),
      recentProducts: recentProducts.map(safeProduct),
      recentPitches: recentPitches.map(safePitch),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listAdminStudents(request, response, next) {
  try {
    const { page, limit } = paginationFrom(request);
    const query = String(request.query.q || "").trim().slice(0, 120);
    const filter = query ? studentSearchFilter(query) : {};
    const [students, total] = await Promise.all([
      User.find(filter).select("firstName lastName email ageGroup createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    response.set("Cache-Control", "no-store");
    return response.json({ students: students.map(safeStudent), pagination: paginationResult(page, limit, total) });
  } catch (error) {
    return next(error);
  }
}

export async function getAdminStudent(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.studentId)) return response.status(404).json({ error: "Student not found." });
  try {
    const student = await User.findById(request.params.studentId).select("firstName lastName email ageGroup createdAt");
    if (!student) return response.status(404).json({ error: "Student not found." });
    const [products, pitches, movements] = await Promise.all([
      Product.find({ studentId: student._id }).sort({ updatedAt: -1 }),
      BusinessPitch.find({ studentId: student._id }).sort({ updatedAt: -1 }),
      InventoryMovement.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(50),
    ]);
    response.set("Cache-Control", "no-store");
    return response.json({
      student: safeStudent(student),
      products: products.map((product) => ({ ...safeProduct(product), student: undefined })),
      inventoryHistory: movements.map(safeMovement),
      pitches: pitches.map((pitch) => ({ ...safePitch(pitch), student: undefined })),
    });
  } catch (error) {
    return next(error);
  }
}

async function queryAdminProducts(request, { inventoryOnly = false } = {}) {
  const { page, limit } = paginationFrom(request);
  const query = String(request.query.q || "").trim().slice(0, 120);
  const filter = {};
  addArchiveFilter(filter, String(request.query.status || (inventoryOnly ? "active" : "all")));
  const studentId = String(request.query.studentId || "");
  const productId = String(request.query.productId || "");
  if (studentId) {
    if (!mongoose.isValidObjectId(studentId)) throw httpError(400, "Student filter is invalid.");
    filter.studentId = studentId;
  }
  if (productId) {
    if (!mongoose.isValidObjectId(productId)) throw httpError(400, "Product filter is invalid.");
    filter._id = productId;
  }
  if (query) {
    const regex = safeRegex(query);
    const ownerIds = await ownerIdsForSearch(query);
    filter.$or = [{ name: regex }, { description: regex }, { category: regex }, { studentId: { $in: ownerIds } }];
  }
  if (request.query.category && request.query.category !== "all") filter.category = String(request.query.category).slice(0, 40);
  if (request.query.lowStock === "true") {
    filter.$expr = { $lte: [{ $subtract: ["$totalProduced", "$totalSold"] }, 5] };
    filter.isArchived = false;
  }
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("studentId", "firstName lastName email ageGroup createdAt"),
    Product.countDocuments(filter),
  ]);
  return { products: products.map(safeProduct), pagination: paginationResult(page, limit, total) };
}

export async function listAdminProducts(request, response, next) {
  try {
    const result = await queryAdminProducts(request);
    response.set("Cache-Control", "no-store");
    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function listAdminInventory(request, response, next) {
  try {
    const result = await queryAdminProducts(request, { inventoryOnly: true });
    response.set("Cache-Control", "no-store");
    return response.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getAdminProduct(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.productId)) return response.status(404).json({ error: "Product not found." });
  try {
    const product = await Product.findById(request.params.productId).populate("studentId", "firstName lastName email ageGroup createdAt");
    if (!product) return response.status(404).json({ error: "Product not found." });
    const movements = await InventoryMovement.find({ productId: product._id }).sort({ createdAt: -1 }).limit(200);
    response.set("Cache-Control", "no-store");
    return response.json({ product: safeProduct(product), movements: movements.map(safeMovement) });
  } catch (error) {
    return next(error);
  }
}

export async function getAdminProductMovements(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.productId)) return response.status(404).json({ error: "Product not found." });
  try {
    const product = await Product.findById(request.params.productId).populate("studentId", "firstName lastName email ageGroup createdAt");
    if (!product) return response.status(404).json({ error: "Product not found." });
    const movements = await InventoryMovement.find({ productId: product._id }).sort({ createdAt: -1 }).limit(500);
    response.set("Cache-Control", "no-store");
    return response.json({ product: safeProduct(product), movements: movements.map(safeMovement) });
  } catch (error) {
    return next(error);
  }
}

export async function listAdminPitches(request, response, next) {
  try {
    const { page, limit } = paginationFrom(request);
    const query = String(request.query.q || "").trim().slice(0, 120);
    const filter = {};
    const status = String(request.query.status || "all");
    if (status === "active") filter.isArchived = false;
    else if (status === "archived") filter.isArchived = true;
    else if (status !== "all") throw httpError(400, "Choose active, archived, or all.");
    if (request.query.studentId) {
      if (!mongoose.isValidObjectId(request.query.studentId)) throw httpError(400, "Student filter is invalid.");
      filter.studentId = request.query.studentId;
    }
    if (query) {
      const regex = safeRegex(query);
      const ownerIds = await ownerIdsForSearch(query);
      filter.$or = [{ businessName: regex }, { targetCustomers: regex }, { eventLocation: regex }, { studentId: { $in: ownerIds } }];
    }
    const [pitches, total] = await Promise.all([
      BusinessPitch.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("studentId", "firstName lastName email ageGroup createdAt"),
      BusinessPitch.countDocuments(filter),
    ]);
    response.set("Cache-Control", "no-store");
    return response.json({ pitches: pitches.map(safePitch), pagination: paginationResult(page, limit, total) });
  } catch (error) {
    return next(error);
  }
}

export async function getAdminPitch(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.pitchId)) return response.status(404).json({ error: "Business pitch not found." });
  try {
    const pitch = await BusinessPitch.findById(request.params.pitchId).populate("studentId", "firstName lastName email ageGroup createdAt");
    if (!pitch) return response.status(404).json({ error: "Business pitch not found." });
    response.set("Cache-Control", "no-store");
    return response.json({ pitch: safePitch(pitch) });
  } catch (error) {
    return next(error);
  }
}
