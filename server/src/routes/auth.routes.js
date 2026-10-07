import { Router } from "express";
import { getMe, logout, logoutAll, refreshToken, requestOtp, verifyOtp } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refreshToken);
router.post("/logout", requireAuth, logout);
router.post("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, getMe);

export default router;
