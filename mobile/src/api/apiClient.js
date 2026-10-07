import axios from "axios";
import { ENV } from "../config/env";
import { toApiError } from "../utils/apiError";

const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    config.headers.set("Accept", "application/json");
    config.headers.set("Content-Type", "application/json");
    return config;
  },
  (error) => Promise.reject(toApiError(error))
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
);

export default apiClient;
