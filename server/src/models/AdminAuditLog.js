import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    resourceType: { type: String, required: true, trim: true, maxlength: 40 },
    resourceId: { type: String, default: "", trim: true, maxlength: 80 },
    reason: { type: String, default: "", trim: true, maxlength: 500 },
    beforeSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    afterSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    requestId: { type: String, default: "", trim: true, maxlength: 80 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
