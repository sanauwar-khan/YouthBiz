import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    quantity: { type: Number, required: true, min: 0.01, max: 100000 },
    unit: { type: String, required: true, trim: true, maxlength: 30 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1200, default: "" },
    category: {
      type: String,
      enum: ["accessories", "art-crafts", "stationery", "home-decor", "other"],
      required: true,
    },
    materials: { type: [materialSchema], default: [] },
    unitCost: { type: Number, required: true, min: 0, max: 10000000 },
    sellingPrice: { type: Number, required: true, min: 0, max: 10000000 },
    initialProductionQuantity: { type: Number, required: true, min: 0, max: 1000000 },
    totalProduced: { type: Number, required: true, min: 0, default: 0 },
    totalSold: { type: Number, required: true, min: 0, default: 0 },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productSchema.index({ studentId: 1, isArchived: 1, updatedAt: -1 });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;