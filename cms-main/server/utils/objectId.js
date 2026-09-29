import crypto from "crypto";

/**
 * Generates a 24-char hex id in the same format as a MongoDB ObjectId
 * (4-byte timestamp + 8 random bytes), so ids stay compatible with the
 * existing `isMongoId()` validators, client routes and old links.
 */
export const newObjectId = () =>
  Math.floor(Date.now() / 1000).toString(16).padStart(8, "0") +
  crypto.randomBytes(8).toString("hex");

export const isValidObjectId = (id) =>
  typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);
