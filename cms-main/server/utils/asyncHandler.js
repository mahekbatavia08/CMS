/**
 * Wraps an async Express route handler and forwards any thrown error
 * to the global error handler via next(), removing the need for
 * repetitive try/catch blocks in every controller.
 *
 * @param {Function} fn - Async (req, res, next) controller function
 * @returns {Function} Express-compatible middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;