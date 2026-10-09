import mongoose from "mongoose";

const otpVerificationSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["login", "registration", "password_reset"],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);

export default OtpVerification;
