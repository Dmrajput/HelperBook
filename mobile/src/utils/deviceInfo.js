import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "helperbook.deviceId";

export async function getDeviceInfo() {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }

  let deviceName = "Android device";
  if (Platform.OS === "ios") {
    deviceName = "iPhone";
  } else if (Platform.OS === "web") {
    deviceName = "Web browser";
  }

  const platform = ["ios", "android", "web"].includes(Platform.OS) ? Platform.OS : "unknown";

  return {
    deviceId,
    deviceName,
    platform,
  };
}
