import { z } from "zod";

const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase());

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: emailSchema,
  ageGroup: z.enum(["8-12", "13-17"]),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
}).strict();