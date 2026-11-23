import AdminAuditLog from "../../models/AdminAuditLog.js";

export async function writeAudit(
  admin,
  { action, resourceType, resourceId, reason, beforeSummary, afterSummary, requestId, ipAddress }
) {
  return AdminAuditLog.create({
    adminId: admin._id || admin.id,
    action,
    resourceType,
    resourceId: resourceId ? String(resourceId) : "",
    reason: reason || "",
    beforeSummary: beforeSummary || null,
    afterSummary: afterSummary || null,
    requestId: requestId || "",
    ipAddress: ipAddress || "",
  });
}
