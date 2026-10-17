import apiClient from "../api/apiClient";

export async function requestOwnerAccountDeletion() {
  const response = await apiClient.post("/account/deletion-request");
  return response.data.data;
}

export async function requestEmployeeAccountDeletion() {
  const response = await apiClient.post("/employee-auth/deletion-request");
  return response.data.data;
}
