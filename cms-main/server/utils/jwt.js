import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "7d";

/**
 * Signs a new JWT for a given admin's id.
 *
 * @param {string} adminId - MongoDB ObjectId of the admin, as a string
 * @returns {string} Signed JWT
 */
const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws if the token is invalid or expired.
 *
 * @param {string} token - JWT to verify
 * @returns {object} Decoded token payload (e.g. { id, iat, exp })
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export { generateToken, verifyToken };