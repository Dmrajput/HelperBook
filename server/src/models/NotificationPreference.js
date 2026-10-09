import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    pushEnabled: { type: Boolean, default: true },
    salaryReminderEnabled: { type: Boolean, default: true },
    salaryPaidEnabled: { type: Boolean, default: true },
    leaveUpdatesEnabled: { type: Boolean, default: true },
    subscriptionRemindersEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NotificationPreference = mongoose.model("NotificationPreference", notificationPreferenceSchema);

export default NotificationPreference;
