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
    legalCompanyName: { type: String, default: "", trim: true, maxlength: 160 },
    companyDescription: { type: String, default: "", trim: true, maxlength: 500 },
    address: { type: String, default: "", trim: true, maxlength: 300 },
    whatsappNumber: { type: String, default: "", trim: true, maxlength: 20 },
    websiteUrl: { type: String, default: "", trim: true, maxlength: 300 },
    appDownloadUrl: { type: String, default: "", trim: true, maxlength: 300 },
    loginUrl: { type: String, default: "", trim: true, maxlength: 300 },
    demoInboxEmail: { type: String, default: "", trim: true, maxlength: 254 },
    privacyPolicyVersion: { type: String, default: "2026-10-24", trim: true, maxlength: 40 },
    reportingTimezone: { type: String, default: "Asia/Kolkata", trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

const PlatformSetting = mongoose.model("PlatformSetting", platformSettingSchema);

export default PlatformSetting;
