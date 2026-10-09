import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";
import { saveTokens } from "../utils/tokenStorage";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

function openPost(path, payload) {
  return request(async () => {
    const response = await apiClient.post(path, payload, {
      skipAuth: true,
      skipAuthRefresh: true,
    });
    return response.data.data;
  });
}

export function loginEmployee(payload) {
  return openPost("/employee-auth/login", payload);
}

export function requestEmployeePasswordReset(phoneNumber) {
  return openPost("/employee-auth/forgot-password", { phoneNumber, countryCode: "+91" });
}

export function resetEmployeePassword(payload) {
  return openPost("/employee-auth/reset-password", payload);
}

export function logoutEmployee(refreshToken) {
  return request(async () => {
    await apiClient.post(
      "/employee-auth/logout",
      { refreshToken },
      { skipAuth: true, skipAuthRefresh: true }
    );
  });
}

export async function getEmployeeProfile() {
  const response = await apiClient.get("/employee-auth/me");
  const data = response.data.data;
  return {
    id: data.employee.id,
    role: "employee",
    name: data.employee.name,
    phone: data.employee.phone,
    employee: data.employee,
    shop: data.shop,
  };
}

export async function saveEmployeeSession(result) {
  await saveTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    role: "employee",
  });
}
