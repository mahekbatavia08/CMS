/**
 * Handles requests to routes that do not exist.
 * Must be registered after all valid routes and before the global error handler.
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

export default notFound;