import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requestOwnerAccountDeletion } from "../services/accountDeletion.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";

const router = Router();

router.post("/deletion-request", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("Your session has expired. Please login again.", 401);
  const data = await requestOwnerAccountDeletion(user);
  sendSuccess(res, data.alreadyRequested ? "A deletion request is already open." : "Deletion request received.", data, data.alreadyRequested ? 200 : 201);
});

export default router;
