import { z } from "zod";

const materialSchema = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.number().positive().max(100000),
  unit: z.string().trim().min(1).max(30),
}).strict();

const productFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1200),
  category: z.enum(["accessories", "art-crafts", "stationery", "home-decor", "other"]),
  materials: z.array(materialSchema).max(50),
  unitCost: z.number().min(0).max(10000000),
  sellingPrice: z.number().min(0).max(10000000),
};

export const createProductSchema = z.object({
  ...productFields,
  description: productFields.description.optional().default(""),
  materials: productFields.materials.optional().default([]),
  initialProductionQuantity: z.number().int().min(0).max(1000000),
}).strict();

export const updateProductSchema = z.object({
  name: productFields.name.optional(),
  description: productFields.description.optional(),
  category: productFields.category.optional(),
  materials: productFields.materials.optional(),
  unitCost: productFields.unitCost.optional(),
  sellingPrice: productFields.sellingPrice.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "Provide a product field to update.",
});

export const inventoryMovementSchema = z.object({
  quantity: z.number().int().positive().max(1000000),
  notes: z.string().trim().max(300).optional().default(""),
}).strict();