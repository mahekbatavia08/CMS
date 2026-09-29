import multer from "multer";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import ApiError from "../utils/ApiError.js";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "temp-floorplans");

    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`);
  },
});

const EXT_MIME_TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];

  // Some browsers/OSes send no mimetype (or a generic one); fall back to the extension.
  if (!file.mimetype || file.mimetype === "application/octet-stream") {
    const extMime = EXT_MIME_TYPES[path.extname(file.originalname).toLowerCase()];
    if (extMime) file.mimetype = extMime;
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only PDF, PNG, JPEG, and WEBP files are allowed for floor plans."));
  }

  cb(null, true);
};

export default multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});
