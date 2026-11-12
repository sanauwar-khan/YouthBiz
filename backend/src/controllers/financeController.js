import mongoose from "mongoose";
import MoneyTransaction from "../models/MoneyTransaction.js";
import { createTransactionSchema, updateTransactionSchema } from "../validation/financeSchemas.js";

function safeTransaction(transaction) {
  return {
    id: transaction._id.toString(),
    type: transaction.type,
    title: transaction.title,
    amount: transaction.amount,
    occurredAt: transaction.occurredAt,
    createdAt: transaction.createdAt,
  };
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function getFinance(request, response, next) {
  try {
    const [transactions, totals] = await Promise.all([
      MoneyTransaction.find({ studentId: request.student._id }).sort({ occurredAt: -1, createdAt: -1 }),
      MoneyTransaction.aggregate([
        { $match: { studentId: new mongoose.Types.ObjectId(request.student._id) } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ]),
    ]);
    const income = totals.find((item) => item._id === "income")?.total || 0;
    const expenses = totals.find((item) => item._id === "expense")?.total || 0;

    return response.json({
      summary: { income: roundMoney(income), expenses: roundMoney(expenses), profit: roundMoney(income - expenses) },
      transactions: transactions.map(safeTransaction),
    });
  } catch (error) {
    return next(error);
  }
}

export async function createTransaction(request, response, next) {
  try {
    const data = createTransactionSchema.parse(request.body);
    const transaction = await MoneyTransaction.create({ ...data, studentId: request.student._id });
    return response.status(201).json({ transaction: safeTransaction(transaction) });
  } catch (error) {
    return next(error);
  }
}

export async function updateTransaction(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.transactionId)) {
    return response.status(404).json({ error: "Transaction not found." });
  }

  try {
    const data = updateTransactionSchema.parse(request.body);
    const transaction = await MoneyTransaction.findOneAndUpdate(
      { _id: request.params.transactionId, studentId: request.student._id },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!transaction) return response.status(404).json({ error: "Transaction not found." });
    return response.json({ transaction: safeTransaction(transaction) });
  } catch (error) {
    return next(error);
  }
}

export async function deleteTransaction(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.transactionId)) {
    return response.status(404).json({ error: "Transaction not found." });
  }

  try {
    const result = await MoneyTransaction.deleteOne({
      _id: request.params.transactionId,
      studentId: request.student._id,
    });
    if (!result.deletedCount) return response.status(404).json({ error: "Transaction not found." });
    return response.json({ message: "Transaction deleted." });
  } catch (error) {
    return next(error);
  }
}