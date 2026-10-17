import mongoose from "mongoose";

export function getHealth(req, res) {
  const body = {
    success: true,
    message: "HelperBook API is running",
  };
  if (process.env.NODE_ENV !== "production") {
    body.environment = process.env.NODE_ENV || "development";
  }
  res.status(200).json(body);
}

export async function getReady(req, res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ success: false, message: "Not ready" });
    return;
  }

  try {
    await mongoose.connection.db.command({ ping: 1 });
    res.status(200).json({ success: true, message: "Ready" });
  } catch {
    res.status(503).json({ success: false, message: "Not ready" });
  }
}
