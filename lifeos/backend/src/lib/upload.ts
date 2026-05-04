import multer from "multer";
import { PassThrough } from "node:stream";
import cloudinary from "./cloudinary.js";
import { ApiError } from "../middleware/errorHandler.js";

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed."));
    }
  },
});

export async function uploadVisionImage(buffer: Buffer, userId: string) {
  return new Promise<string>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `lifeos/users/${userId}/vision`,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
        public_id: `vision_${Date.now()}_${Math.random().toString(36).slice(2)}`
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result.secure_url);
      }
    );

    const stream = new PassThrough();
    stream.end(buffer);
    stream.pipe(upload);
  });
}

// For AI notebook image parsing (in-memory, not saved to cloud)
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
