import mongoose from "mongoose";

export const LEAD_TYPES = ["demo", "inquiry"];
export const DEMO_STATUSES = ["new", "contacted", "demo_scheduled", "demo_completed", "closed", "spam"];
export const INQUIRY_STATUSES = ["new", "contacted", "closed", "spam"];
export const INQUIRY_CATEGORIES = [
  "product_question",
  "sales_inquiry",
  "existing_customer_support",
  "partnership",
  "other",
];
export const TEAM_SIZES = ["1-5", "6-20", "21-50", "51-100", "101+"];

const marketingLeadSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: LEAD_TYPES, index: true },
    referenceId: { type: String, required: true, unique: true, trim: true, maxlength: 32 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    companyName: { type: String, default: "", trim: true, maxlength: 160 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    teamSize: { type: String, default: "", enum: ["", ...TEAM_SIZES] },
    inquiryCategory: { type: String, default: "", enum: ["", ...INQUIRY_CATEGORIES] },
    message: { type: String, default: "", trim: true, maxlength: 4000 },
    preferredDate: { type: String, default: "", trim: true, maxlength: 10 },
    preferredTimeWindow: { type: String, default: "", trim: true, maxlength: 80 },
    timezone: { type: String, default: "Asia/Kolkata", trim: true, maxlength: 64 },
    status: { type: String, required: true, default: "new", trim: true, maxlength: 40, index: true },
    assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    sourcePage: { type: String, default: "", trim: true, maxlength: 200 },
    privacyAcknowledgedAt: { type: Date, required: true },
    privacyPolicyVersion: { type: String, default: "2026-10-24", trim: true, maxlength: 40 },
    marketingConsent: { type: Boolean, default: false },
    internalNotes: [
      {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
        body: { type: String, trim: true, maxlength: 4000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    idempotencyKey: { type: String, default: undefined, trim: true, maxlength: 80 },
    ipHash: { type: String, default: "", trim: true, maxlength: 128 },
    userAgent: { type: String, default: "", trim: true, maxlength: 300 },
    emailNotifyStatus: {
      type: String,
      enum: ["skipped", "queued", "sent", "failed"],
      default: "skipped",
    },
  },
  { timestamps: true }
);

marketingLeadSchema.index({ type: 1, createdAt: -1 });
marketingLeadSchema.index({ status: 1, createdAt: -1 });
marketingLeadSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

const MarketingLead = mongoose.model("MarketingLead", marketingLeadSchema);

export default MarketingLead;
