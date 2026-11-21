import mongoose from "mongoose";
import PRD from "../models/PRD.js";
import { prdWriteSchema } from "../validation/adminSchemas.js";

function safePrd(prd) {
  return {
    id: prd._id.toString(),
    title: prd.title,
    projectName: prd.projectName,
    overview: prd.overview,
    problemStatement: prd.problemStatement,
    objectives: prd.objectives,
    targetUsers: prd.targetUsers,
    proposedSolutions: prd.proposedSolutions,
    userStories: prd.userStories,
    functionalRequirements: prd.functionalRequirements,
    nonFunctionalRequirements: prd.nonFunctionalRequirements,
    rolePermissions: prd.rolePermissions,
    featuresWorkflows: prd.featuresWorkflows,
    acceptanceCriteria: prd.acceptanceCriteria,
    scope: prd.scope,
    outOfScope: prd.outOfScope,
    successMetrics: prd.successMetrics,
    status: prd.status,
    createdBy: prd.createdBy && typeof prd.createdBy === "object"
      ? { id: prd.createdBy._id.toString(), email: prd.createdBy.email }
      : prd.createdBy?.toString(),
    updatedBy: prd.updatedBy && typeof prd.updatedBy === "object"
      ? { id: prd.updatedBy._id.toString(), email: prd.updatedBy.email }
      : prd.updatedBy?.toString(),
    createdAt: prd.createdAt,
    updatedAt: prd.updatedAt,
  };
}

function notFound(response) {
  return response.status(404).json({ error: "PRD not found." });
}

export async function listPrds(_request, response, next) {
  try {
    const prds = await PRD.find().sort({ updatedAt: -1 }).populate("createdBy", "email").populate("updatedBy", "email").limit(200);
    response.set("Cache-Control", "no-store");
    return response.json({ prds: prds.map(safePrd) });
  } catch (error) {
    return next(error);
  }
}

export async function getPrd(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.prdId)) return notFound(response);
  try {
    const prd = await PRD.findById(request.params.prdId).populate("createdBy", "email").populate("updatedBy", "email");
    if (!prd) return notFound(response);
    response.set("Cache-Control", "no-store");
    return response.json({ prd: safePrd(prd) });
  } catch (error) {
    return next(error);
  }
}

export async function createPrd(request, response, next) {
  try {
    const data = prdWriteSchema.parse(request.body);
    const prd = await PRD.create({ ...data, createdBy: request.admin._id, updatedBy: request.admin._id });
    return response.status(201).json({ prd: safePrd(prd) });
  } catch (error) {
    return next(error);
  }
}

export async function updatePrd(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.prdId)) return notFound(response);
  try {
    const data = prdWriteSchema.parse(request.body);
    const prd = await PRD.findByIdAndUpdate(
      request.params.prdId,
      { $set: { ...data, updatedBy: request.admin._id } },
      { new: true, runValidators: true },
    );
    if (!prd) return notFound(response);
    return response.json({ prd: safePrd(prd) });
  } catch (error) {
    return next(error);
  }
}

export async function deletePrd(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.prdId)) return notFound(response);
  try {
    const prd = await PRD.findByIdAndDelete(request.params.prdId);
    if (!prd) return notFound(response);
    return response.json({ message: "PRD deleted." });
  } catch (error) {
    return next(error);
  }
}
