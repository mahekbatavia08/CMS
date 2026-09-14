/**
 * Escapes regex metacharacters in a user-supplied string so it can be safely
 * embedded in a MongoDB $regex/RegExp query without enabling regex-injection
 * or catastrophic-backtracking (ReDoS) via crafted input.
 *
 * @param {string} value - Raw, untrusted string
 * @returns {string} The same string with regex metacharacters escaped
 */
export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default escapeRegex;
