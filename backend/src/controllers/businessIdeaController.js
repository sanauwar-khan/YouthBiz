import mongoose from "mongoose";
import BusinessIdea from "../models/BusinessIdea.js";
import { createBusinessIdeaSchema, updateBusinessIdeaSchema } from "../validation/businessIdeaSchemas.js";

function safeIdea(idea) {
  return {
    id: idea._id.toString(),
    title: idea.title,
    description: idea.description,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

export async function listBusinessIdeas(request, response, next) {
  try {
    const ideas = await BusinessIdea.find({ studentId: request.student._id }).sort({ updatedAt: -1 });
    return response.json({ ideas: ideas.map(safeIdea) });
  } catch (error) {
    return next(error);
  }
}

export async function getBusinessIdea(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.ideaId)) {
    return response.status(404).json({ error: "Business idea not found." });
  }

  try {
    const idea = await BusinessIdea.findOne({
      _id: request.params.ideaId,
      studentId: request.student._id,
    });
    if (!idea) return response.status(404).json({ error: "Business idea not found." });
    return response.json({ idea: safeIdea(idea) });
  } catch (error) {
    return next(error);
  }
}

export async function createBusinessIdea(request, response, next) {
  try {
    const data = createBusinessIdeaSchema.parse(request.body);
    const idea = await BusinessIdea.create({ ...data, studentId: request.student._id });
    return response.status(201).json({ idea: safeIdea(idea) });
  } catch (error) {
    return next(error);
  }
}

export async function updateBusinessIdea(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.ideaId)) {
    return response.status(404).json({ error: "Business idea not found." });
  }

  try {
    const data = updateBusinessIdeaSchema.parse(request.body);
    const idea = await BusinessIdea.findOneAndUpdate(
      { _id: request.params.ideaId, studentId: request.student._id },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!idea) return response.status(404).json({ error: "Business idea not found." });
    return response.json({ idea: safeIdea(idea) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBusinessIdea(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.ideaId)) {
    return response.status(404).json({ error: "Business idea not found." });
  }

  try {
    const result = await BusinessIdea.deleteOne({
      _id: request.params.ideaId,
      studentId: request.student._id,
    });
    if (!result.deletedCount) return response.status(404).json({ error: "Business idea not found." });
    return response.json({ message: "Business idea deleted." });
  } catch (error) {
    return next(error);
  }
}