import apiClient from "../api/apiClient";
import { saveTokens } from "../utils/tokenStorage";

function openPost(path, payload) {
  return apiClient.post(path, payload, {
    skipAuth: true,
    skipAuthRefresh: true,
  });
}

export async function registerOwner(payload) {
  const response = await openPost("/auth/register", payload);
  return response.data.data;
}

export async function loginWithPassword(payload) {
  const response = await openPost("/auth/login", payload);
  return response.data.data;
}

export async function requestPasswordReset(payload) {
  const response = await openPost("/auth/forgot-password", payload);
  return response.data.data;
}

export async function resetPassword(payload) {
  const response = await openPost("/auth/reset-password", payload);
  return response.data.data;
}

export async function refreshSession(refreshToken) {
  const response = await apiClient.post(
    "/auth/refresh",
    { refreshToken },
    { skipAuth: true, skipAuthRefresh: true }
  );
  const data = response.data.data;
  await saveTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data;
}

export async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return response.data.data.user;
}

export async function logout(refreshToken) {
  try {
    await apiClient.post("/auth/logout", { refreshToken }, { skipAuthRefresh: true });
  } catch (error) {
    if (error?.status !== 401) {
      throw error;
    }

    const refreshed = await refreshSession(refreshToken);
    await apiClient.post(
      "/auth/logout",
      { refreshToken: refreshed.refreshToken },
      { skipAuthRefresh: true }
    );
  }
}

export async function logoutAll() {
  const response = await apiClient.post("/auth/logout-all", {}, { skipAuthRefresh: true });
  return response.data;
}
