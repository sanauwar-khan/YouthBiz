import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["production", "sale"], required: true },
    quantity: { type: Number, required: true, min: 1, max: 1000000 },
    unitCost: { type: Number, min: 0, max: 10000000, default: null },
    unitPrice: { type: Number, min: 0, max: 10000000, default: null },
    notes: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true },
);

inventoryMovementSchema.index({ studentId: 1, productId: 1, createdAt: -1 });

const InventoryMovement = mongoose.models.InventoryMovement || mongoose.model("InventoryMovement", inventoryMovementSchema);

export default InventoryMovement;