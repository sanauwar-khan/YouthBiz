import mongoose from "mongoose";

const rolePermissionSchema = new mongoose.Schema({
  role: { type: String, required: true, trim: true, maxlength: 100 },
  permissions: { type: [String], default: [] },
}, { _id: false });

const prdSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  projectName: { type: String, required: true, trim: true, maxlength: 160 },
  overview: { type: String, default: "", maxlength: 5000 },
  problemStatement: { type: String, default: "", maxlength: 5000 },
  objectives: { type: [String], default: [] },
  targetUsers: { type: [String], default: [] },
  proposedSolutions: { type: [String], default: [] },
  userStories: { type: [String], default: [] },
  functionalRequirements: { type: [String], default: [] },
  nonFunctionalRequirements: { type: [String], default: [] },
  rolePermissions: { type: [rolePermissionSchema], default: [] },
  featuresWorkflows: { type: String, default: "", maxlength: 10000 },
  acceptanceCriteria: { type: [String], default: [] },
  scope: { type: [String], default: [] },
  outOfScope: { type: [String], default: [] },
  successMetrics: { type: [String], default: [] },
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
}, { timestamps: true });

prdSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.models.PRD || mongoose.model("PRD", prdSchema);
