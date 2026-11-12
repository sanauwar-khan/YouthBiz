import mongoose from "mongoose";

const moneyTransactionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 10000000,
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

moneyTransactionSchema.index({ studentId: 1, occurredAt: -1 });

const MoneyTransaction = mongoose.models.MoneyTransaction || mongoose.model("MoneyTransaction", moneyTransactionSchema);

export default MoneyTransaction;