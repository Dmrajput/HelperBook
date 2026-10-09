export const ADMIN_ROLES = ["super_admin", "support_agent", "finance_admin", "read_only_admin"];

export const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  support_agent: [
    "dashboard.read",
    "users.read",
    "users.suspend",
    "shops.read",
    "shops.suspend",
    "employees.read",
    "payments.read",
    "support.read",
    "support.reply",
    "analytics.read",
    "audit.read",
  ],
  finance_admin: [
    "dashboard.read",
    "users.read",
    "shops.read",
    "subscriptions.read",
    "subscriptions.update",
    "payments.read",
    "payments.refund",
    "reports.read",
    "reports.export",
    "coupons.read",
    "coupons.create",
    "coupons.update",
    "analytics.read",
    "audit.read",
  ],
  read_only_admin: [
    "dashboard.read",
    "users.read",
    "shops.read",
    "employees.read",
    "subscriptions.read",
    "payments.read",
    "reports.read",
    "analytics.read",
    "support.read",
    "coupons.read",
    "audit.read",
  ],
};

export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function adminHasPermission(admin, permission) {
  const granted = permissionsFor(admin?.role);
  return granted.includes("*") || granted.includes(permission);
}
