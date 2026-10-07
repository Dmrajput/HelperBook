import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { AppError } from "../../../utils/appError.js";
import { extensionForImage } from "../../../utils/imageFile.js";

export function getLocalUploadRoot() {
  if (process.env.IMAGE_LOCAL_DIR) {
    return path.resolve(process.env.IMAGE_LOCAL_DIR);
  }

  return path.join(os.tmpdir(), "helperbook-uploads");
}

function safeFilename(publicId) {
  const filename = path.basename(String(publicId || ""));
  if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/i.test(filename)) {
    throw new AppError("Unable to upload logo. Please try again.", 400);
  }
  return filename;
}

export function createLocalProvider() {
  return {
    async upload({ buffer, mimeType, origin }) {
      if (process.env.NODE_ENV === "production") {
        throw new AppError("Unable to upload logo. Please try again.", 503, true);
      }

      const filename = `${randomBytes(16).toString("hex")}.${extensionForImage(mimeType)}`;
      const root = getLocalUploadRoot();
      await mkdir(root, { recursive: true });
      await writeFile(path.join(root, filename), buffer);

      const base = String(origin || "").replace(/\/$/, "");
      return {
        url: `${base}/uploads/${filename}`,
        publicId: filename,
        uploadedAt: new Date(),
      };
    },

    async remove(publicId) {
      if (!publicId) {
        return;
      }

      const filename = safeFilename(publicId);
      try {
        await unlink(path.join(getLocalUploadRoot(), filename));
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    },
  };
}
