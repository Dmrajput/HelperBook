import mongoose from "mongoose";

const otpRateLimitSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  hits: {
    type: [Date],
    default: [],
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

otpRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpRateLimit = mongoose.model("OtpRateLimit", otpRateLimitSchema);

export default OtpRateLimit;
