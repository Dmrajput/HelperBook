import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    const response = await work();
    return response.data.data.shop;
  } catch (error) {
    throw toApiError(error);
  }
}

export function getMyShop() {
  return request(() => apiClient.get("/shops/me"));
}

export function createShop(payload) {
  return request(() => apiClient.post("/shops", payload));
}

export function updateMyShop(payload) {
  return request(() => apiClient.put("/shops/me", payload));
}

export function uploadShopLogo(file) {
  const form = new FormData();
  form.append("logo", {
    uri: file.uri,
    name: file.name || "logo.jpg",
    type: file.type || "image/jpeg",
  });

  return request(() =>
    apiClient.post("/shops/me/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
      transformRequest: (data) => data,
      timeout: 60000,
    })
  );
}

export function deleteShopLogo() {
  return request(() => apiClient.delete("/shops/me/logo"));
}
