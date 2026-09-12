import { Router } from "express";
import {
  create,
  getAll,
  getOverview,
  getOne,
  update,
  remove,
  uploadFloorPlan,
  deleteFloorPlan,
  replaceFloorPlan,
} from "../controllers/projectController.js";
import {
  createProjectValidator,
  updateProjectValidator,
} from "../validators/projectValidator.js";
import validateRequest from "../middlewares/validateRequest.js";
import protect from "../middlewares/authMiddleware.js";
import { uploadDocuments } from "../middlewares/uploadMiddleware.js";
import uploadFloorPlanMiddleware from "../middlewares/uploadFloorPlan.js";

const router = Router();

router.post(
  "/",
  protect,
  uploadDocuments,
  createProjectValidator,
  validateRequest,
  create,
);

router.get("/", protect, getAll);
router.get("/overview", protect, getOverview);
router.get("/:id", protect, getOne);

router.patch("/:id", protect, updateProjectValidator, validateRequest, update);

router.delete("/:id", protect, remove);

router.post(
  "/:projectId/floorplans",
  protect,
  uploadFloorPlanMiddleware.single("file"),
  uploadFloorPlan,
);

router.patch(
  "/:projectId/floorplans/:floorPlanId",
  protect,
  uploadFloorPlanMiddleware.single("file"),
  replaceFloorPlan,
);

router.delete("/:projectId/floorplans/:floorPlanId", protect, deleteFloorPlan);

export default router;
