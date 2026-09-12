import Admin from "../models/Admin.js";
import ApiError from "../utils/ApiError.js";
import { generateToken } from "../utils/jwt.js";
import mongoose from "mongoose";

/**
 * Authenticates an admin by email and password, and returns a signed JWT
 * along with the admin's public profile (password excluded).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, admin: object }>}
 */
const loginAdmin = async (email, password) => {
  const admin = await Admin.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "This account has been deactivated");
  }

  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(admin._id.toString());

  const adminData = admin.toJSON();

  return { token, admin: adminData };
};

/**
 * Fetches an admin's public profile by id.
 *
 * @param {string} adminId
 * @returns {Promise<object>} Admin profile (password excluded)
 */
const getAdminById = async (adminId) => {
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  return admin.toJSON();
};

export { loginAdmin, getAdminById };
