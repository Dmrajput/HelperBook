import apiClient from "../api/apiClient";

export async function checkServerHealth() {
  const response = await apiClient.get("/health");
  return response.data;
}
