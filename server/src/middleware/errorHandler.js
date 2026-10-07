import { sendFailure } from "../utils/apiResponse.js";
import { redactSensitive } from "../utils/redact.js";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const loggedError =
    err?.expose === true || isProduction()
      ? redactSensitive(err?.message || "Unknown error")
      : redactSensitive(err?.stack || err?.message || "Unknown error");
  console.error(loggedError);

  if (
    err?.expose === true &&
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode !== 500
  ) {
    sendFailure(res, err.message, err.statusCode);
    return;
  }

  if (err?.name === "ValidationError") {
    sendFailure(res, "The submitted information is invalid.", 422);
    return;
  }

  if (err?.name === "CastError") {
    sendFailure(res, "The request contains an invalid value.", 400);
    return;
  }

  if (Number(err?.code) === 11000) {
    sendFailure(res, "This record already exists.", 409);
    return;
  }

  if (err?.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400)) {
    sendFailure(res, "The request body is not valid JSON.", 400);
    return;
  }

  if (err?.type === "entity.too.large") {
    sendFailure(res, "The request is too large.", 413);
    return;
  }

  if (err?.message === "Not allowed by CORS") {
    sendFailure(res, "This origin is not allowed.", 403);
    return;
  }

  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  const message =
    statusCode >= 500 || isProduction()
      ? "Something went wrong"
      : err?.message || "Something went wrong";

  sendFailure(res, statusCode >= 500 ? "Something went wrong" : message, statusCode);
}
