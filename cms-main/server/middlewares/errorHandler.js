import ApiError from "../utils/ApiError.js";

/**
 * Centralized error handling middleware.
 * Must be registered last, after all routes and the notFound middleware.
 *
 * Provides a consistent JSON error response shape across the application.
 * Stack traces are only exposed when NODE_ENV is not "production".
 */
const errorHandler = (err, req, res, next) => {
  // Prefer a status code explicitly attached to the error (e.g. via ApiError).
  // Fall back to a status code already set on the response, then default to 500.
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  const isProduction = process.env.NODE_ENV === "production";

  // ApiError messages are intentionally written to be safe to show to
  // clients. Anything else (raw Mongoose/DB/programming errors) can leak
  // internal details, so it's replaced with a generic message in production.
  const isOperational = err instanceof ApiError;
  const message =
    isOperational || !isProduction
      ? err.message || "Internal Server Error"
      : "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    stack: isProduction ? undefined : err.stack,
  });
};

export default errorHandler;