import mongoose from "mongoose";

const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    displayName: { type: String, default: "HelperBook", trim: true, maxlength: 80 },
    supportEmail: { type: String, default: "", trim: true, maxlength: 254 },
    supportPhone: { type: String, default: "", trim: true, maxlength: 20 },
    supportHours: { type: String, default: "Monday to Saturday, 10:00 to 18:00 IST", trim: true, maxlength: 160 },
    maintenanceBanner: { type: String, default: "", trim: true, maxlength: 300 },
    couponsEnabled: { type: Boolean, default: true },
    ticketSequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const PlatformSetting = mongoose.model("PlatformSetting", platformSettingSchema);

export default PlatformSetting;
