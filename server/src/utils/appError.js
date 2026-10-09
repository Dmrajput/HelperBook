export class AppError extends Error {
  constructor(message, statusCode = 500, expose, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.expose = expose === undefined ? statusCode < 500 : expose;
    this.details = details;
  }
}
