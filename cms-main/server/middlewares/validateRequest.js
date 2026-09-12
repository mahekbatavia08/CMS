import { validationResult } from "express-validator";

/**
 * Runs after express-validator rule chains. If any validation errors were
 * collected, responds with a 400 and a consistent error shape listing every
 * field-level message. Otherwise passes control to the next middleware.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

export default validateRequest;