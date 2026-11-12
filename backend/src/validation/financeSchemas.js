import { z } from "zod";

const transactionFields = {
  type: z.enum(["income", "expense"]),
  title: z.string().trim().min(1).max(100),
  amount: z.number().positive().max(10000000),
  occurredAt: z.coerce.date(),
};

export const createTransactionSchema = z.object({
  type: transactionFields.type,
  title: transactionFields.title,
  amount: transactionFields.amount,
  occurredAt: transactionFields.occurredAt.optional().default(() => new Date()),
}).strict();

export const updateTransactionSchema = z.object({
  type: transactionFields.type.optional(),
  title: transactionFields.title.optional(),
  amount: transactionFields.amount.optional(),
  occurredAt: transactionFields.occurredAt.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "Provide a transaction field to update.",
});