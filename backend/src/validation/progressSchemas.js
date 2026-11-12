import { z } from "zod";

export const createProgressStepSchema = z.object({
  title: z.string().trim().min(1).max(120),
}).strict();

export const updateProgressStepSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  completed: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "Provide a progress field to update.",
});