import asyncHandler from "../utils/asyncHandler.js";
import sendSuccess from "../utils/apiResponse.js";
import { loginAdmin, getAdminById } from "../services/authService.js";

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { token, admin } = await loginAdmin(email, password);

  sendSuccess(res, 200, "Login successful", { token, admin });
});

/**
 * @route   POST /api/auth/logout
 * @access  Private
 *
 * Since JWTs are stateless, logout is handled client-side by discarding
 * the token. This endpoint exists for a consistent API contract and to
 * allow future server-side token invalidation (e.g. a blacklist) if needed.
 */
const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, "Logout successful");
});

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const admin = await getAdminById(req.admin._id);

  sendSuccess(res, 200, "Current admin fetched successfully", { admin });
});

export { login, logout, getMe };
