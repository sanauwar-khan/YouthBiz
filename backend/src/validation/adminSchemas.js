import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(256),
}).strict();

const lineList = z.array(z.string().trim().min(1).max(2000)).max(50).default([]);

const prdBaseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  projectName: z.string().trim().min(1).max(160),
  overview: z.string().trim().max(5000).default(""),
  problemStatement: z.string().trim().max(5000).default(""),
  objectives: lineList,
  targetUsers: lineList,
  proposedSolutions: lineList,
  userStories: lineList,
  functionalRequirements: lineList,
  nonFunctionalRequirements: lineList,
  rolePermissions: z.array(z.object({ role: z.string().trim().min(1).max(100), permissions: lineList }).strict()).max(30).default([]),
  featuresWorkflows: z.string().trim().max(10000).default(""),
  acceptanceCriteria: lineList,
  scope: lineList,
  outOfScope: lineList,
  successMetrics: lineList,
  status: z.enum(["draft", "published"]).default("draft"),
}).strict();

export const prdWriteSchema = prdBaseSchema.superRefine((data, context) => {
  if (data.status !== "published") return;
  for (const field of ["overview", "problemStatement", "featuresWorkflows"]) {
    if (!data[field].trim()) context.addIssue({ code: "custom", path: [field], message: "This section is required before publishing." });
  }
  for (const field of ["objectives", "targetUsers", "proposedSolutions", "userStories", "functionalRequirements", "nonFunctionalRequirements", "acceptanceCriteria", "scope", "outOfScope", "successMetrics"]) {
    if (data[field].length === 0) context.addIssue({ code: "custom", path: [field], message: "Add at least one item before publishing." });
  }
  if (data.rolePermissions.length === 0 || data.rolePermissions.some((entry) => entry.permissions.length === 0)) {
    context.addIssue({ code: "custom", path: ["rolePermissions"], message: "Add at least one role with permissions before publishing." });
  }
});
