import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";
import { ApiError } from "../middleware/errorHandler.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary as any,
  params: async (req: any, file: any) => ({
    folder: `lifeos/users/${req.user?.id || "public"}/vision`,
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
    public_id: `vision_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  }),
});

export const uploadMiddleware = multer({
  storage,
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

// For AI notebook image parsing (in-memory, not saved to cloud)
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
