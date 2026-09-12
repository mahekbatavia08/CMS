import { Router } from "express";
import { login, logout, getMe } from "../controllers/authController.js";
import { loginValidator } from "../validators/authValidator.js";
import validateRequest from "../middlewares/validateRequest.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

router.post(
  "/login",
  loginValidator,
  validateRequest,
  login,
);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
