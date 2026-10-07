import { getDashboard as loadDashboard } from "../services/dashboard.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";

export async function getDashboard(req, res) {
  try {
    const data = await loadDashboard(req.user.id);
    sendSuccess(res, "Dashboard fetched successfully", data);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Unable to load dashboard", 503, true);
  }
}
