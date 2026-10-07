import { AppError } from "./appError.js";
import { MAX_LOGO_BYTES } from "../constants/shop.js";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return "image/png";
  }

  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  return null;
}

export function extensionForImage(mimeType) {
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  return "jpg";
}

export function assertLogoFile(file) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new AppError("Choose a logo image.", 400);
  }

  if (file.buffer.length === 0 || file.size === 0) {
    throw new AppError("Choose a logo image.", 400);
  }

  if (file.buffer.length > MAX_LOGO_BYTES || file.size > MAX_LOGO_BYTES) {
    throw new AppError("Logo image must be smaller than 5 MB.", 400);
  }

  const extension = String(file.originalname || "").toLowerCase().match(/(\.[a-z0-9]+)$/)?.[1] || "";
  if (extension && ![".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    throw new AppError("Please choose a JPG, PNG, or WebP image.", 400);
  }

  const detected = detectImageType(file.buffer);
  if (!detected) {
    throw new AppError("Please choose a JPG, PNG, or WebP image.", 400);
  }

  const declared = file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype;
  if (declared && declared !== detected) {
    throw new AppError("Please choose a JPG, PNG, or WebP image.", 400);
  }

  return detected;
}
