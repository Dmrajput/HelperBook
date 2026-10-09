import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    passwordHash: {
      type: String,
      default: "",
      select: false,
    },
    role: {
      type: String,
      enum: ["owner"],
      default: "owner",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    suspensionReason: { type: String, default: "", trim: true, maxlength: 300 },
    suspendedAt: { type: Date, default: null },
    suspendedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    adminNotes: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

userSchema.index({ countryCode: 1, phoneNumber: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
