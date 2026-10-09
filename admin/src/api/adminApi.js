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

export const adminApi = {
  login: (body) => request("/admin/auth/login", { method: "POST", body, retry: false }),
  logout: () => request("/admin/auth/logout", { method: "POST", body: { refreshToken }, retry: false }),
  me: () => request("/admin/auth/me"),
  summary: (range) => request(`/admin/dashboard/summary?range=${range}`),
  trends: (range) => request(`/admin/dashboard/trends?range=${range}`),
  activity: () => request("/admin/dashboard/recent-activity"),
  users: (query) => request(`/admin/users?${query}`),
  user: (id) => request(`/admin/users/${id}`),
  userStatus: (id, body) => request(`/admin/users/${id}/status`, { method: "PATCH", body }),
  shops: (query) => request(`/admin/shops?${query}`),
  shop: (id) => request(`/admin/shops/${id}`),
  shopStatus: (id, body) => request(`/admin/shops/${id}/status`, { method: "PATCH", body }),
  employees: (query) => request(`/admin/employees?${query}`),
  employee: (id) => request(`/admin/employees/${id}`),
  employeeLogin: (id, body) => request(`/admin/employees/${id}/login-status`, { method: "PATCH", body }),
  subscriptions: (query) => request(`/admin/subscriptions?${query}`),
  subscription: (id) => request(`/admin/subscriptions/${id}`),
  payments: (query) => request(`/admin/payments?${query}`),
  payment: (id) => request(`/admin/payments/${id}`),
  refund: (id, body) => request(`/admin/payments/${id}/refunds`, { method: "POST", body }),
  registrations: (range) => request(`/admin/reports/registrations?range=${range}`),
  paymentReport: (range) => request(`/admin/reports/payments?range=${range}`),
  supportReport: (range) => request(`/admin/reports/support?range=${range}`),
  tickets: (query) => request(`/admin/support/tickets?${query}`),
  ticket: (id) => request(`/admin/support/tickets/${id}`),
  reply: (id, body) => request(`/admin/support/tickets/${id}/replies`, { method: "POST", body }),
  note: (id, body) => request(`/admin/support/tickets/${id}/internal-notes`, { method: "POST", body }),
  ticketPatch: (id, body) => request(`/admin/support/tickets/${id}`, { method: "PATCH", body }),
  coupons: () => request("/admin/coupons"),
  createCoupon: (body) => request("/admin/coupons", { method: "POST", body }),
  updateCoupon: (id, body) => request(`/admin/coupons/${id}`, { method: "PATCH", body }),
  analytics: (section, range) => request(`/admin/analytics/${section}?range=${range}`),
  audit: () => request("/admin/audit-logs"),
  settings: () => request("/admin/settings"),
  saveSettings: (body) => request("/admin/settings", { method: "PATCH", body }),
  admins: () => request("/admin/admins"),
  createAdmin: (body) => request("/admin/admins", { method: "POST", body }),
  search: (q) => request(`/admin/search?q=${encodeURIComponent(q)}`),
};
