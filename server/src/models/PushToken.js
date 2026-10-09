import mongoose from "mongoose";
import { PUSH_PLATFORMS } from "../constants/notification.js";

const pushTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    token: { type: String, required: true, trim: true, maxlength: 200 },
    platform: { type: String, enum: PUSH_PLATFORMS, required: true },
    deviceId: { type: String, required: true, trim: true, maxlength: 80 },
    appVersion: { type: String, default: "", trim: true, maxlength: 40 },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

pushTokenSchema.index({ token: 1 }, { unique: true });
pushTokenSchema.index(
  { userId: 1, deviceId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } }
);
pushTokenSchema.index(
  { employeeId: 1, deviceId: 1 },
  { unique: true, partialFilterExpression: { employeeId: { $type: "objectId" } } }
);
pushTokenSchema.index({ userId: 1, isActive: 1 });
pushTokenSchema.index({ employeeId: 1, isActive: 1 });

const PushToken = mongoose.model("PushToken", pushTokenSchema);

export default PushToken;
