export function sendSuccess(res, message, data = {}, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendFailure(res, message, statusCode = 500) {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}
