import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 254,
    },
    ageGroup: {
      type: String,
      enum: ["8-12", "13-17"],
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, result) {
        delete result.passwordHash;
        delete result.__v;
        return result;
      },
    },
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;