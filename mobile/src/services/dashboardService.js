import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

export async function getDashboard() {
  try {
    const response = await apiClient.get("/dashboard");
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}
