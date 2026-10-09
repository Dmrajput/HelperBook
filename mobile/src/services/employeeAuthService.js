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

export function requestEmployeeOtp(phoneNumber) {
  return request(async () => {
    const response = await apiClient.post(
      "/employee-auth/request-otp",
      { phoneNumber, countryCode: "+91" },
      { skipAuth: true, skipAuthRefresh: true }
    );
    return response.data.data;
  });
}

export function verifyEmployeeOtp(payload) {
  return request(async () => {
    const response = await apiClient.post("/employee-auth/verify-otp", payload, {
      skipAuth: true,
      skipAuthRefresh: true,
    });
    return response.data.data;
  });
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
