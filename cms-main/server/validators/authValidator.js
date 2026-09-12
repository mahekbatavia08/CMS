import { body } from "express-validator";

/**
 * Validation rules for the login request body.
 * Applied as middleware before the login controller runs.
 */
const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

export { loginValidator };