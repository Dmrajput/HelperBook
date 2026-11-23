export function auditMeta(req) {
  return {
    requestId: req?.id || "",
    ipAddress: String(req?.ip || "").replace("::ffff:", ""),
  };
}

export function withAuditMeta(admin, meta = {}) {
  return { admin, meta };
}
