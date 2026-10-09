import mongoose from "mongoose";
import { ADMIN_ROLES } from "../config/adminPermissions.js";

const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ADMIN_ROLES, required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminUserSchema.index({ email: 1 }, { unique: true });

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;
