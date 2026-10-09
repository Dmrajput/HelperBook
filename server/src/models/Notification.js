import mongoose from "mongoose";
import { NOTIFICATION_TYPES, PUSH_STATUSES } from "../constants/notification.js";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    recipientType: { type: String, enum: ["owner", "employee"], default: "owner" },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    pushTitle: { type: String, default: "", trim: true, maxlength: 120 },
    pushMessage: { type: String, default: "", trim: true, maxlength: 180 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    entityType: { type: String, enum: ["salary", "leave", "subscription"], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    pushStatus: { type: String, enum: PUSH_STATUSES, default: "pending" },
    pushSentAt: { type: Date, default: null },
    pushAttempts: { type: Number, default: 0 },
    eventKey: { type: String, required: true, maxlength: 180 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ eventKey: 1 }, { unique: true });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ shopId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ employeeId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
