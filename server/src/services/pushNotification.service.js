import PushToken from "../models/PushToken.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const TOKEN_PATTERN = /^Expo(nent)?PushToken\[.+\]$/;

export function isExpoPushToken(token) {
  return TOKEN_PATTERN.test(String(token || ""));
}

function channelFor(type) {
  if (type?.startsWith("salary")) return "salary";
  if (type?.startsWith("leave")) return "leave";
  if (type?.startsWith("subscription")) return "subscription";
  return "default";
}

export async function sendExpoPush({ tokens, title, message, data, type }) {
  const targets = tokens.filter((item) => item.isActive && isExpoPushToken(item.token));
  if (!targets.length) {
    return { accepted: false, invalidTokens: [] };
  }
  const messages = targets.map((item) => ({
    to: item.token,
    title,
    body: message,
    sound: "default",
    channelId: channelFor(type),
    data: Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, value == null ? "" : String(value)])),
  }));
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV PUSH] ${title}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error("Push provider rejected the request.", response.status);
      return { accepted: false, invalidTokens: [] };
    }
    const payload = await response.json();
    const tickets = Array.isArray(payload?.data) ? payload.data : [];
    const invalidTokens = [];
    let accepted = false;
    tickets.forEach((ticket, index) => {
      if (ticket?.status === "ok") {
        accepted = true;
        return;
      }
      const reason = ticket?.details?.error || ticket?.message || "PushFailed";
      console.error("Push delivery failed.", reason);
      if (reason === "DeviceNotRegistered") {
        invalidTokens.push(targets[index].token);
      }
    });
    if (invalidTokens.length) {
      await PushToken.updateMany({ token: { $in: invalidTokens } }, { isActive: false });
    }
    return { accepted, invalidTokens };
  } catch (error) {
    console.error("Push provider unavailable.", error?.name === "AbortError" ? "timeout" : "request failed");
    return { accepted: false, invalidTokens: [] };
  } finally {
    clearTimeout(timer);
  }
}
