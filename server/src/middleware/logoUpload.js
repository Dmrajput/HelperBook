import multer from "multer";
import { MAX_LOGO_BYTES } from "../constants/shop.js";
import { AppError } from "../utils/appError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_LOGO_BYTES,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const mimeType = file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype;
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      callback(new AppError("Please choose a JPG, PNG, or WebP image.", 400));
      return;
    }
    callback(null, true);
  },
});

export function logoUpload(req, res, next) {
  upload.single("logo")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Logo image must be smaller than 5 MB.", 400));
      return;
    }

    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError("Please choose a JPG, PNG, or WebP image.", 400));
  });
}
