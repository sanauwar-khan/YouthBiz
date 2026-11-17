import mongoose from "mongoose";

const pitchProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true, trim: true, maxlength: 100 },
    proposedPrice: { type: Number, required: true, min: 0, max: 10000000 },
    unitCostSnapshot: { type: Number, required: true, min: 0, max: 10000000 },
    expectedQuantity: { type: Number, required: true, min: 1, max: 1000000 },
  },
  { _id: false },
);

const businessPitchSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessName: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    products: { type: [pitchProductSchema], required: true, validate: [(items) => items.length > 0, "Add at least one product."] },
    targetCustomers: { type: String, required: true, trim: true, maxlength: 600 },
    uniqueValue: { type: String, required: true, trim: true, maxlength: 1000 },
    eventDate: { type: Date, required: true },
    eventLocation: { type: String, required: true, trim: true, maxlength: 200 },
    estimatedRevenue: { type: Number, required: true, min: 0 },
    estimatedCosts: { type: Number, required: true, min: 0 },
    estimatedProfit: { type: Number, required: true },
    eventStatus: { type: String, enum: ["proposed"], default: "proposed", immutable: true },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

businessPitchSchema.index({ studentId: 1, isArchived: 1, updatedAt: -1 });

const BusinessPitch = mongoose.models.BusinessPitch || mongoose.model("BusinessPitch", businessPitchSchema);

export default BusinessPitch;