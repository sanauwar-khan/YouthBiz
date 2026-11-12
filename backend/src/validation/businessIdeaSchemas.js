import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(100);
const descriptionSchema = z.string().trim().max(1200);

export const createBusinessIdeaSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional().default(""),
}).strict();

export const updateBusinessIdeaSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "Provide a title or description to update.",
});