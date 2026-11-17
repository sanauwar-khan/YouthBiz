import mongoose from "mongoose";
import InventoryMovement from "../models/InventoryMovement.js";
import Product from "../models/Product.js";
import { createProductSchema, inventoryMovementSchema, updateProductSchema } from "../validation/productSchemas.js";

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
    isArchived: product.isArchived,
    archivedAt: product.archivedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function isTransactionUnsupported(error) {
  return error?.code === 20
    || error?.codeName === "IllegalOperation"
    || /transaction numbers are only allowed|does not support transactions|replica set.*transactions/i.test(error?.message || "");
}

async function inMongoTransaction(operation) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      const unsupported = new Error("This MongoDB deployment does not support safe inventory transactions.");
      unsupported.code = "TRANSACTIONS_UNSUPPORTED";
      throw unsupported;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function listProducts(request, response, next) {
  try {
    const filter = { studentId: request.student._id };
    if (request.query.includeArchived !== "true") filter.isArchived = false;
    const products = await Product.find(filter).sort({ updatedAt: -1 });
    return response.json({ products: products.map(safeProduct) });
  } catch (error) {
    return next(error);
  }
}

export async function getProduct(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.productId)) {
    return response.status(404).json({ error: "Product not found." });
  }
  try {
    const product = await Product.findOne({ _id: request.params.productId, studentId: request.student._id });
    if (!product) return response.status(404).json({ error: "Product not found." });
    return response.json({ product: safeProduct(product) });
  } catch (error) {
    return next(error);
  }
}

export async function createProduct(request, response, next) {
  try {
    const data = createProductSchema.parse(request.body);
    const product = await inMongoTransaction(async (session) => {
      const [created] = await Product.create([{
        ...data,
        studentId: request.student._id,
        totalProduced: data.initialProductionQuantity,
        totalSold: 0,
      }], { session });

      if (data.initialProductionQuantity > 0) {
        await InventoryMovement.create([{
          studentId: request.student._id,
          productId: created._id,
          type: "production",
          quantity: data.initialProductionQuantity,
          unitCost: data.unitCost,
          notes: "Initial production",
        }], { session });
      }
      return created;
    });
    return response.status(201).json({ product: safeProduct(product) });
  } catch (error) {
    return next(error);
  }
}

export async function updateProduct(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.productId)) {
    return response.status(404).json({ error: "Product not found." });
  }
  try {
    const data = updateProductSchema.parse(request.body);
    const product = await Product.findOneAndUpdate(
      { _id: request.params.productId, studentId: request.student._id, isArchived: false },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!product) return response.status(404).json({ error: "Product not found." });
    return response.json({ product: safeProduct(product) });
  } catch (error) {
    return next(error);
  }
}

export async function archiveProduct(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.productId)) {
    return response.status(404).json({ error: "Product not found." });
  }
  try {
    const product = await Product.findOneAndUpdate(
      { _id: request.params.productId, studentId: request.student._id, isArchived: false },
      { $set: { isArchived: true, archivedAt: new Date() } },
      { new: true },
    );
    if (!product) return response.status(404).json({ error: "Product not found." });
    return response.json({ product: safeProduct(product) });
  } catch (error) {
    return next(error);
  }
}

export async function listInventory(request, response, next) {
  try {
    const products = await Product.find({ studentId: request.student._id, isArchived: false }).sort({ name: 1 });
    return response.json({
      products: products.map((product) => ({
        ...safeProduct(product),
        isLowStock: product.totalProduced - product.totalSold <= 5,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listInventoryMovements(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.productId)) {
    return response.status(404).json({ error: "Product not found." });
  }
  try {
    const product = await Product.findOne({ _id: request.params.productId, studentId: request.student._id });
    if (!product) return response.status(404).json({ error: "Product not found." });
    const movements = await InventoryMovement.find({
      studentId: request.student._id,
      productId: product._id,
    }).sort({ createdAt: -1 });
    return response.json({
      movements: movements.map((movement) => ({
        id: movement._id.toString(),
        type: movement.type,
        quantity: movement.quantity,
        unitCost: movement.unitCost,
        unitPrice: movement.unitPrice,
        notes: movement.notes,
        createdAt: movement.createdAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function recordMovement(request, response, next, type) {
  if (!mongoose.isValidObjectId(request.params.productId)) {
    return response.status(404).json({ error: "Product not found." });
  }
  try {
    const data = inventoryMovementSchema.parse(request.body);
    const result = await inMongoTransaction(async (session) => {
      const filter = {
        _id: request.params.productId,
        studentId: request.student._id,
        isArchived: false,
      };
      if (type === "sale") {
        filter.$expr = { $gte: [{ $subtract: ["$totalProduced", "$totalSold"] }, data.quantity] };
      }
      const update = type === "production"
        ? { $inc: { totalProduced: data.quantity } }
        : { $inc: { totalSold: data.quantity } };
      const product = await Product.findOneAndUpdate(filter, update, { new: true, session });
      if (!product) {
        const ownedProduct = await Product.findOne({ _id: request.params.productId, studentId: request.student._id }).session(session);
        if (!ownedProduct || ownedProduct.isArchived) throw httpError(404, "Product not found.");
        throw httpError(409, "Not enough available stock to record this sale.");
      }

      const [movement] = await InventoryMovement.create([{
        studentId: request.student._id,
        productId: product._id,
        type,
        quantity: data.quantity,
        unitCost: type === "production" ? product.unitCost : null,
        unitPrice: type === "sale" ? product.sellingPrice : null,
        notes: data.notes,
      }], { session });
      return { product, movement };
    });

    return response.status(201).json({
      product: { ...safeProduct(result.product), isLowStock: result.product.totalProduced - result.product.totalSold <= 5 },
      movement: {
        id: result.movement._id.toString(),
        type: result.movement.type,
        quantity: result.movement.quantity,
        unitCost: result.movement.unitCost,
        unitPrice: result.movement.unitPrice,
        notes: result.movement.notes,
        createdAt: result.movement.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export function recordProduction(request, response, next) {
  return recordMovement(request, response, next, "production");
}

export function recordSale(request, response, next) {
  return recordMovement(request, response, next, "sale");
}