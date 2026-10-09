import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { createOwnerTicket } from "../services/admin/adminPlatform.service.js";
import User from "../models/User.js";

const router = Router();

router.use(requireAuth);
router.post("/tickets", async (req, res) => {
  const user = await User.findById(req.user.id);
  const data = await createOwnerTicket(user, req.body || {});
  sendSuccess(res, "Support request sent.", data, 201);
});

export default router;
