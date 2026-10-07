import { createHash, randomBytes } from "crypto";
import { AppError } from "../../../utils/appError.js";
import { extensionForImage } from "../../../utils/imageFile.js";

const UPLOAD_FAILED = "Unable to upload logo. Please try again.";

function requireConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError(UPLOAD_FAILED, 503, true);
  }

  return { cloudName, apiKey, apiSecret };
}

function signParams(params, apiSecret) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

async function readCloudinaryResponse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.error) {
    throw new AppError(UPLOAD_FAILED, 503, true);
  }
  return payload;
}

export function createCloudinaryProvider() {
  return {
    async upload({ buffer, mimeType }) {
      const { cloudName, apiKey, apiSecret } = requireConfig();
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "helperbook/logos";
      const publicId = randomBytes(16).toString("hex");
      const signature = signParams({ folder, public_id: publicId, timestamp }, apiSecret);
      const form = new FormData();
      form.append(
        "file",
        new Blob([buffer], { type: mimeType }),
        `logo.${extensionForImage(mimeType)}`
      );
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("folder", folder);
      form.append("public_id", publicId);
      form.append("signature", signature);

      let payload;
      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: form,
          signal: AbortSignal.timeout(20000),
        });
        payload = await readCloudinaryResponse(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(UPLOAD_FAILED, 503, true);
      }

      if (!payload?.secure_url || !payload?.public_id) {
        throw new AppError(UPLOAD_FAILED, 503, true);
      }

      return {
        url: payload.secure_url,
        publicId: payload.public_id,
        uploadedAt: new Date(),
      };
    },

    async remove(publicId) {
      if (!publicId) {
        return;
      }

      const { cloudName, apiKey, apiSecret } = requireConfig();
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = signParams({ public_id: publicId, timestamp }, apiSecret);
      const body = new URLSearchParams({
        public_id: publicId,
        api_key: apiKey,
        timestamp: String(timestamp),
        signature,
      });

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          signal: AbortSignal.timeout(20000),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || (payload?.result && !["ok", "not found"].includes(payload.result))) {
          throw new AppError(UPLOAD_FAILED, 503, true);
        }
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(UPLOAD_FAILED, 503, true);
      }
    },
  };
}
