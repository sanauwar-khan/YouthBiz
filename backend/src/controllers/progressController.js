import mongoose from "mongoose";
import ProgressStep from "../models/ProgressStep.js";
import { createProgressStepSchema, updateProgressStepSchema } from "../validation/progressSchemas.js";

function safeStep(step) {
  return {
    id: step._id.toString(),
    title: step.title,
    completed: step.completed,
    createdAt: step.createdAt,
    updatedAt: step.updatedAt,
  };
}

export async function listProgressSteps(request, response, next) {
  try {
    const steps = await ProgressStep.find({ studentId: request.student._id }).sort({ createdAt: 1 });
    return response.json({ steps: steps.map(safeStep) });
  } catch (error) {
    return next(error);
  }
}

export async function createProgressStep(request, response, next) {
  try {
    const data = createProgressStepSchema.parse(request.body);
    const step = await ProgressStep.create({ ...data, studentId: request.student._id });
    return response.status(201).json({ step: safeStep(step) });
  } catch (error) {
    return next(error);
  }
}

export async function updateProgressStep(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.stepId)) {
    return response.status(404).json({ error: "Progress step not found." });
  }

  try {
    const data = updateProgressStepSchema.parse(request.body);
    const step = await ProgressStep.findOneAndUpdate(
      { _id: request.params.stepId, studentId: request.student._id },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!step) return response.status(404).json({ error: "Progress step not found." });
    return response.json({ step: safeStep(step) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteProgressStep(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.stepId)) {
    return response.status(404).json({ error: "Progress step not found." });
  }

  try {
    const result = await ProgressStep.deleteOne({
      _id: request.params.stepId,
      studentId: request.student._id,
    });
    if (!result.deletedCount) return response.status(404).json({ error: "Progress step not found." });
    return response.json({ message: "Progress step deleted." });
  } catch (error) {
    return next(error);
  }
}