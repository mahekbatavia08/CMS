import { Router } from "express";
import authRoutes from "./authRoutes.js";
import projectRoutes from "./projectRoutes.js";
import mediaRoutes from "./mediaRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import filterRoutes from "./filterRoutes.js";

const router = Router();

/**
 * Root API health/status route.
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio CMS API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/projects/:id/media", mediaRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/filters", filterRoutes);

export default router;