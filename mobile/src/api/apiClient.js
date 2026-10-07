import axios from "axios";
import { ENV } from "../config/env";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "../utils/tokenStorage";
import { attachAuthInterceptors } from "./authInterceptor";

const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let sessionExpiredHandler = null;

attachAuthInterceptors(apiClient, {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  onSessionExpired() {
    sessionExpiredHandler?.();
  },
});

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
}

export default apiClient;
