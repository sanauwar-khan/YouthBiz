import { z } from "zod";

const pitchProductSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  proposedPrice: z.number().min(0).max(10000000),
  expectedQuantity: z.number().int().positive().max(1000000),
}).strict();

export const businessPitchSchema = z.object({
  businessName: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(2000),
  products: z.array(pitchProductSchema).min(1).max(50).refine(
    (products) => new Set(products.map((product) => product.productId.toLowerCase())).size === products.length,
    "A product can only be listed once in a pitch.",
  ),
  targetCustomers: z.string().trim().min(1).max(600),
  uniqueValue: z.string().trim().min(1).max(1000),
  eventDate: z.coerce.date().refine((date) => date.getTime() >= Date.now(), "Choose a proposed event date in the future."),
  eventLocation: z.string().trim().min(1).max(200),
}).strict();