/**
 * Custom error class used across the application to attach an HTTP status
 * code to an error, so the centralized errorHandler middleware can respond
 * with the correct status instead of always defaulting to 500.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to send with this error
   * @param {string} message - Human-readable error message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;