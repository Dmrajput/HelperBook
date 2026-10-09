import mongoose from "mongoose";

const employeeOtpVerificationSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    phoneNumber: { type: String, required: true, trim: true },
    hashedOtp: { type: String, required: true },
    purpose: { type: String, enum: ["login"], default: "login", required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, required: true },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

employeeOtpVerificationSchema.index({ phoneNumber: 1, purpose: 1, createdAt: -1 });
employeeOtpVerificationSchema.index({ employeeId: 1, createdAt: -1 });
employeeOtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmployeeOtpVerification = mongoose.model("EmployeeOtpVerification", employeeOtpVerificationSchema);

export default EmployeeOtpVerification;
