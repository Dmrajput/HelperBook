import mongoose from "mongoose";

const employeeSessionSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    refreshTokenHash: { type: String, required: true },
    deviceId: { type: String, required: true, trim: true },
    deviceName: { type: String, default: "", trim: true },
    platform: { type: String, default: "unknown", trim: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

employeeSessionSchema.index({ employeeId: 1, createdAt: -1 });
employeeSessionSchema.index({ refreshTokenHash: 1 });
employeeSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmployeeSession = mongoose.model("EmployeeSession", employeeSessionSchema);

export default EmployeeSession;
