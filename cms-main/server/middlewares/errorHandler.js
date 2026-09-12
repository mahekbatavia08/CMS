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

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: isProduction ? undefined : err.stack,
  });
};

export default errorHandler;