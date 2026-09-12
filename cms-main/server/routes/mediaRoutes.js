import { Router } from "express";
import {
  uploadCover,
  uploadThumbnail,
  uploadGallery,
  uploadProjectVideo,
  uploadProjectFloorPlan,
  uploadProjectBrochure,
  uploadProjectLegal,
} from "../controllers/mediaController.js";
import {
  uploadImageSingle,
  uploadVideoSingle,
  uploadDocumentSingle,
} from "../middlewares/uploadMiddleware.js";
import protect from "../middlewares/authMiddleware.js";

// Mounted at /api/projects/:id/media in routes/index.js
const router = Router({ mergeParams: true });

router.post("/cover", protect, uploadImageSingle("file"), uploadCover);
router.post("/thumbnail", protect, uploadImageSingle("file"), uploadThumbnail);
router.post("/gallery", protect, uploadImageSingle("file"), uploadGallery);
router.post("/video", protect, uploadVideoSingle("file"), uploadProjectVideo);
router.post("/floorplan", protect, uploadImageSingle("file"), uploadProjectFloorPlan);
router.post("/brochure", protect, uploadDocumentSingle("file"), uploadProjectBrochure);
router.post(
  "/legal",
  protect,
  uploadDocumentSingle("file"),
  uploadProjectLegal
);

export default router;