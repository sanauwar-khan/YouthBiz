import mongoose from "mongoose";

const progressStepSchema = new mongoose.Schema(
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
      maxlength: 120,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

progressStepSchema.index({ studentId: 1, createdAt: 1 });

const ProgressStep = mongoose.models.ProgressStep || mongoose.model("ProgressStep", progressStepSchema);

export default ProgressStep;