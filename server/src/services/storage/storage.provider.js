import { AppError } from "../../utils/appError.js";
import { createCloudinaryProvider } from "./providers/cloudinary.provider.js";
import { createLocalProvider } from "./providers/local.provider.js";

let cachedProvider = null;
let cachedName = "";

export function getImageStorage() {
  const name = process.env.IMAGE_PROVIDER || "";
  if (cachedProvider && cachedName === name) {
    return cachedProvider;
  }

  if (name === "local") {
    cachedProvider = createLocalProvider();
  } else if (name === "cloudinary") {
    cachedProvider = createCloudinaryProvider();
  } else {
    throw new AppError("Unable to upload logo. Please try again.", 503, true);
  }

  cachedName = name;
  return cachedProvider;
}

export function resetImageStorage() {
  cachedProvider = null;
  cachedName = "";
}
