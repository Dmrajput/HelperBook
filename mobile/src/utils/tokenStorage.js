import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "helperbook.accessToken";
const REFRESH_TOKEN_KEY = "helperbook.refreshToken";

async function removeItem(key) {
  const existing = await SecureStore.getItemAsync(key);
  if (existing) {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveTokens({ accessToken, refreshToken }) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await removeItem(ACCESS_TOKEN_KEY);
  await removeItem(REFRESH_TOKEN_KEY);
}
