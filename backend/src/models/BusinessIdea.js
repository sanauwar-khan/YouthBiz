import mongoose from "mongoose";

const businessIdeaSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: "",
    },
  },
  { timestamps: true },
);

businessIdeaSchema.index({ studentId: 1, updatedAt: -1 });

const BusinessIdea = mongoose.models.BusinessIdea || mongoose.model("BusinessIdea", businessIdeaSchema);

export default BusinessIdea;