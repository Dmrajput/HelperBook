import { API_BASE } from "@/config/site";

export class PublicApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PublicApiError(payload.message || "The request failed.", response.status);
  }
  return payload.data;
}

export const publicApi = {
  platform: () => request("/public/platform"),
  plans: () => request("/public/plans"),
  demoRequest: (body) => request("/public/demo-requests", { method: "POST", body }),
  inquiry: (body) => request("/public/inquiries", { method: "POST", body }),
};
