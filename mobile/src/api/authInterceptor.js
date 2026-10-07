import { toApiError } from "../utils/apiError";
import { createRefreshQueue } from "./refreshQueue";

const OPEN_AUTH_PATHS = ["/auth/request-otp", "/auth/verify-otp", "/auth/refresh"];

function isOpenAuthRequest(config) {
  const url = config?.url || "";
  return OPEN_AUTH_PATHS.some((path) => url.includes(path));
}

export function attachAuthInterceptors(client, deps) {
  const refreshOnce = createRefreshQueue(async () => {
    const refreshToken = await deps.getRefreshToken();
    if (!refreshToken) {
      const error = new Error("Missing refresh token");
      error.isAuthFailure = true;
      throw error;
    }

    const response = await client.post(
      "/auth/refresh",
      { refreshToken },
      { skipAuth: true, skipAuthRefresh: true }
    );
    const nextTokens = response?.data?.data;

    if (!nextTokens?.accessToken || !nextTokens?.refreshToken) {
      const error = new Error("Refresh failed");
      error.isAuthFailure = true;
      throw error;
    }

    await deps.saveTokens(nextTokens);
    return nextTokens.accessToken;
  });

  client.interceptors.request.use(
    async (config) => {
      config.headers.set("Accept", "application/json");
      config.headers.set("Content-Type", "application/json");

      if (!config.skipAuth) {
        const accessToken = await deps.getAccessToken();
        if (accessToken) {
          config.headers.set("Authorization", `Bearer ${accessToken}`);
        }
      }

      return config;
    },
    (error) => Promise.reject(toApiError(error))
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config;
      const status = error?.response?.status;
      const canRefresh =
        config &&
        status === 401 &&
        !config._retry &&
        !config.skipAuthRefresh &&
        !isOpenAuthRequest(config);

      if (!canRefresh) {
        return Promise.reject(toApiError(error));
      }

      config._retry = true;

      try {
        const accessToken = await refreshOnce();
        config.headers.set("Authorization", `Bearer ${accessToken}`);
        return client(config);
      } catch (refreshError) {
        await deps.clearTokens();
        deps.onSessionExpired?.();
        return Promise.reject(toApiError(refreshError?.response ? refreshError : error));
      }
    }
  );
}
