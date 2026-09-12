import { Router } from "express";
import {
  getStats,
  getProjectOverview,
} from "../controllers/dashboardController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/stats", protect, getStats);
router.get("/project-overview", protect, getProjectOverview);

export default router;