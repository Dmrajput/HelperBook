const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
const API_URL = typeof rawApiUrl === "string" ? rawApiUrl.trim().replace(/\/+$/, "") : "";

if (!API_URL) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_URL. Add it to mobile/.env using your computer's LAN address, for example http://192.168.1.100:5000/api"
  );
}

let parsedApiUrl;

try {
  parsedApiUrl = new URL(API_URL);
} catch {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not a valid URL. Use your computer's LAN address, for example http://192.168.1.100:5000/api"
  );
}

if (parsedApiUrl.protocol !== "http:" && parsedApiUrl.protocol !== "https:") {
  throw new Error("EXPO_PUBLIC_API_URL must start with http:// or https://");
}

if (
  typeof __DEV__ !== "undefined" &&
  __DEV__ &&
  (parsedApiUrl.hostname === "localhost" || parsedApiUrl.hostname === "127.0.0.1")
) {
  console.warn(
    "EXPO_PUBLIC_API_URL points at localhost. A physical Android device cannot reach localhost. Use your computer's LAN IP instead."
  );
}

export const ENV = {
  API_URL,
};
