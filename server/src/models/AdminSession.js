import mongoose from "mongoose";

const adminSessionSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
    refreshTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminSessionSchema.index({ adminId: 1, createdAt: -1 });
adminSessionSchema.index({ refreshTokenHash: 1 });
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdminSession = mongoose.model("AdminSession", adminSessionSchema);

export default AdminSession;
