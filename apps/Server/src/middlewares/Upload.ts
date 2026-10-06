import multer from "multer";
import { ServiceError } from "../Services/errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Photos are held in memory and streamed straight to Cloudinary; nothing is
// written to the server's disk (Render's disk is wiped on every deploy).
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return callback(null, true);
    callback(new ServiceError(400, "Use a JPG, PNG or WebP photo."));
  },
}).single("image");
