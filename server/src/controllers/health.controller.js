export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: "HelperBook API is running",
    environment: process.env.NODE_ENV || "development",
  });
}
