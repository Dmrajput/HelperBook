const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

let accessToken = "";
let refreshToken = "";
let onExpired = () => {};

export function setAdminTokens({ access, refresh }) {
  accessToken = access || "";
  refreshToken = refresh || "";
}

export function setAdminExpiredHandler(handler) {
  onExpired = handler;
}

export class AdminApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = "GET", body, retry = true } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 401 && retry && refreshToken && !path.includes("/admin/auth/")) {
    const refreshed = await fetch(`${baseUrl}/admin/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await refreshed.json().catch(() => ({}));
    if (!refreshed.ok || !payload?.data?.accessToken) {
      setAdminTokens({});
      onExpired();
      throw new AdminApiError("Your session has expired. Please log in again.", 401, "ADMIN_SESSION_EXPIRED");
    }
    setAdminTokens({ access: payload.data.accessToken, refresh: payload.data.refreshToken });
    return request(path, { method, body, retry: false });
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(payload.message || "The request failed.", response.status, payload.data?.code);
  }
  return payload.data;
}

function qs(query = "") {
  if (!query) return "";
  return query.startsWith("?") || query.includes("=") ? `?${query.replace(/^\?/, "")}` : `?${query}`;
}

export const adminApi = {
  login: (body) => request("/admin/auth/login", { method: "POST", body, retry: false }),
  logout: () => request("/admin/auth/logout", { method: "POST", body: { refreshToken }, retry: false }),
  me: () => request("/admin/auth/me"),
  summary: (query) => request(`/admin/dashboard/summary${qs(query)}`),
  trends: (query) => request(`/admin/dashboard/trends${qs(query)}`),
  activity: () => request("/admin/dashboard/recent-activity"),
  attention: () => request("/admin/dashboard/attention"),
  users: (query) => request(`/admin/users${qs(query)}`),
  user: (id) => request(`/admin/users/${id}`),
  userStatus: (id, body) => request(`/admin/users/${id}/status`, { method: "PATCH", body }),
  shops: (query) => request(`/admin/shops${qs(query)}`),
  shop: (id) => request(`/admin/shops/${id}`),
  shopStatus: (id, body) => request(`/admin/shops/${id}/status`, { method: "PATCH", body }),
  shopUpdate: (id, body) => request(`/admin/shops/${id}`, { method: "PATCH", body }),
  employees: (query) => request(`/admin/employees${qs(query)}`),
  employee: (id) => request(`/admin/employees/${id}`),
  employeeLogin: (id, body) => request(`/admin/employees/${id}/login-status`, { method: "PATCH", body }),
  subscriptions: (query) => request(`/admin/subscriptions${qs(query)}`),
  subscription: (id) => request(`/admin/subscriptions/${id}`),
  subscriptionRecovery: (id, body) => request(`/admin/subscriptions/${id}/recovery`, { method: "POST", body }),
  cancelRenewal: (id, body) => request(`/admin/subscriptions/${id}/cancel-renewal`, { method: "POST", body }),
  assignPlan: (id, body) => request(`/admin/subscriptions/${id}/assign-plan`, { method: "POST", body }),
  planPricing: () => request("/admin/plan-pricing"),
  updatePlanPricing: (planId, body) => request(`/admin/plan-pricing/${planId}`, { method: "PATCH", body }),
  payments: (query) => request(`/admin/payments${qs(query)}`),
  payment: (id) => request(`/admin/payments/${id}`),
  refund: (id, body) => request(`/admin/payments/${id}/refunds`, { method: "POST", body }),
  manualPayment: (body) => request("/admin/payments/manual", { method: "POST", body }),
  registrations: (query) => request(`/admin/reports/registrations${qs(query)}`),
  paymentReport: (query) => request(`/admin/reports/payments${qs(query)}`),
  supportReport: (query) => request(`/admin/reports/support${qs(query)}`),
  tickets: (query) => request(`/admin/support/tickets${qs(query)}`),
  ticket: (id) => request(`/admin/support/tickets/${id}`),
  reply: (id, body) => request(`/admin/support/tickets/${id}/replies`, { method: "POST", body }),
  note: (id, body) => request(`/admin/support/tickets/${id}/internal-notes`, { method: "POST", body }),
  ticketPatch: (id, body) => request(`/admin/support/tickets/${id}`, { method: "PATCH", body }),
  coupons: () => request("/admin/coupons"),
  createCoupon: (body) => request("/admin/coupons", { method: "POST", body }),
  updateCoupon: (id, body) => request(`/admin/coupons/${id}`, { method: "PATCH", body }),
  analytics: (section, query) => request(`/admin/analytics/${section}${qs(query)}`),
  audit: (query) => request(`/admin/audit-logs${qs(query)}`),
  settings: () => request("/admin/settings"),
  saveSettings: (body) => request("/admin/settings", { method: "PATCH", body }),
  admins: () => request("/admin/admins"),
  createAdmin: (body) => request("/admin/admins", { method: "POST", body }),
  setAdminActive: (id, body) => request(`/admin/admins/${id}/status`, { method: "PATCH", body }),
  search: (q) => request(`/admin/search?q=${encodeURIComponent(q)}`),
  leads: (query) => request(`/admin/leads${qs(query)}`),
  lead: (id) => request(`/admin/leads/${id}`),
  updateLead: (id, body) => request(`/admin/leads/${id}`, { method: "PATCH", body }),
};
