import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "temp-floorplans");

    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(null, `${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF, PNG, and JPEG files are allowed for floor plans."));
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
