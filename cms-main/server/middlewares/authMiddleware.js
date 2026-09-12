import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwt.js";
import Admin from "../models/Admin.js";

/**
 * Protects routes by requiring a valid JWT in the Authorization header,
 * in the form: "Authorization: Bearer <token>".
 *
 * On success, attaches the authenticated admin document (password excluded)
 * to req.admin for use in downstream controllers.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw new ApiError(401, "Not authorized, invalid or expired token");
  }

  const admin = await Admin.findById(decoded.id);

  if (!admin) {
    throw new ApiError(401, "Not authorized, admin no longer exists");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  req.admin = admin;
  next();
});

export default protect;