import mongoose from "mongoose";
import BusinessPitch from "../models/BusinessPitch.js";
import Product from "../models/Product.js";
import { businessPitchSchema } from "../validation/businessPitchSchemas.js";

function safePitch(pitch) {
  return {
    id: pitch._id.toString(),
    businessName: pitch.businessName,
    description: pitch.description,
    products: pitch.products.map((product) => ({
      productId: product.productId.toString(),
      productName: product.productName,
      proposedPrice: product.proposedPrice,
      unitCostSnapshot: product.unitCostSnapshot,
      expectedQuantity: product.expectedQuantity,
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
  };
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function buildPitchData(data, studentId) {
  const productIds = data.products.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    studentId,
    isArchived: false,
  }).select("name unitCost");

  if (products.length !== productIds.length) {
    const error = new Error("One or more selected products are unavailable.");
    error.status = 400;
    throw error;
  }

  const byId = new Map(products.map((product) => [product._id.toString(), product]));
  const pitchProducts = data.products.map((line) => {
    const product = byId.get(line.productId);
    return {
      productId: product._id,
      productName: product.name,
      proposedPrice: line.proposedPrice,
      unitCostSnapshot: product.unitCost,
      expectedQuantity: line.expectedQuantity,
    };
  });
  const estimatedRevenue = pitchProducts.reduce((total, item) => total + item.proposedPrice * item.expectedQuantity, 0);
  const estimatedCosts = pitchProducts.reduce((total, item) => total + item.unitCostSnapshot * item.expectedQuantity, 0);

  return {
    ...data,
    products: pitchProducts,
    estimatedRevenue: roundMoney(estimatedRevenue),
    estimatedCosts: roundMoney(estimatedCosts),
    estimatedProfit: roundMoney(estimatedRevenue - estimatedCosts),
    eventStatus: "proposed",
  };
}

export async function listBusinessPitches(request, response, next) {
  try {
    const filter = { studentId: request.student._id };
    if (request.query.includeArchived !== "true") filter.isArchived = false;
    const pitches = await BusinessPitch.find(filter).sort({ updatedAt: -1 });
    return response.json({ pitches: pitches.map(safePitch) });
  } catch (error) {
    return next(error);
  }
}

export async function getBusinessPitch(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.pitchId)) {
    return response.status(404).json({ error: "Business pitch not found." });
  }
  try {
    const pitch = await BusinessPitch.findOne({ _id: request.params.pitchId, studentId: request.student._id });
    if (!pitch) return response.status(404).json({ error: "Business pitch not found." });
    return response.json({ pitch: safePitch(pitch) });
  } catch (error) {
    return next(error);
  }
}

export async function createBusinessPitch(request, response, next) {
  try {
    const data = businessPitchSchema.parse(request.body);
    const pitchData = await buildPitchData(data, request.student._id);
    const pitch = await BusinessPitch.create({ ...pitchData, studentId: request.student._id });
    return response.status(201).json({ pitch: safePitch(pitch) });
  } catch (error) {
    return next(error);
  }
}

export async function updateBusinessPitch(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.pitchId)) {
    return response.status(404).json({ error: "Business pitch not found." });
  }
  try {
    const data = businessPitchSchema.parse(request.body);
    const pitchData = await buildPitchData(data, request.student._id);
    const pitch = await BusinessPitch.findOneAndUpdate(
      { _id: request.params.pitchId, studentId: request.student._id, isArchived: false },
      { $set: pitchData },
      { new: true, runValidators: true },
    );
    if (!pitch) return response.status(404).json({ error: "Business pitch not found." });
    return response.json({ pitch: safePitch(pitch) });
  } catch (error) {
    return next(error);
  }
}

export async function archiveBusinessPitch(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.pitchId)) {
    return response.status(404).json({ error: "Business pitch not found." });
  }
  try {
    const pitch = await BusinessPitch.findOneAndUpdate(
      { _id: request.params.pitchId, studentId: request.student._id, isArchived: false },
      { $set: { isArchived: true, archivedAt: new Date() } },
      { new: true },
    );
    if (!pitch) return response.status(404).json({ error: "Business pitch not found." });
    return response.json({ pitch: safePitch(pitch) });
  } catch (error) {
    return next(error);
  }
}