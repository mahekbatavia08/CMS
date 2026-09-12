import multer from "multer";
import path from "path";
import fs from "fs";
// export const uploadDocuments = uploadDocument.any();

import {
  TEMP_DIR,
  generateUniqueFilename,
} from "../utils/fileHelpers.js";

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },

  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  },
});

const createFileFilter = (allowedMimeTypes, allowedExtensions, typeName) => {
  return (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const isImage = typeName === "image" && (
      !file.mimetype || 
      file.mimetype.startsWith("image/") || 
      file.mimetype === "application/octet-stream"
    );
    const isVideo = typeName === "video" && file.mimetype?.startsWith("video/");
    const isDoc = typeName === "document" && file.mimetype === "application/pdf";

    const hasValidMime = allowedMimeTypes.includes(file.mimetype) || isImage || isVideo || isDoc;
    const hasValidExt = allowedExtensions.includes(extension) || !extension || hasValidMime;

    if (hasValidMime || hasValidExt) {
      return cb(null, true);
    }

    cb(
      new Error(
        `Only ${typeName} files are allowed.`
      ),
      false
    );
  };
};

const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
];
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp", ".svg", ".heic", ".heif"];

const videoMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const videoExtensions = [".mp4", ".webm", ".mov"];

const documentMimeTypes = [
  "application/pdf",
];
const documentExtensions = [".pdf"];

const uploadImage = multer({
  storage,
  fileFilter: createFileFilter(
    imageMimeTypes,
    imageExtensions,
    "image"
  ),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadVideo = multer({
  storage,
  fileFilter: createFileFilter(
    videoMimeTypes,
    videoExtensions,
    "video"
  ),
  limits: {
    fileSize: 250 * 1024 * 1024,
  },
});

const uploadDocument = multer({
  storage,
  fileFilter: createFileFilter(
    documentMimeTypes,
    documentExtensions,
    "document"
  ),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export const uploadImageSingle = (fieldName = "file") =>
  uploadImage.single(fieldName);

export const uploadVideoSingle = (fieldName = "file") =>
  uploadVideo.single(fieldName);

export const uploadDocumentSingle = (fieldName = "file") =>
  uploadDocument.single(fieldName);

export const uploadDocuments = uploadDocument.any();