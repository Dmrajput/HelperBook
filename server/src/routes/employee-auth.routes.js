import { Router } from "express";
import { getMe, logout, logoutAll, refreshToken, requestOtp, verifyOtp } from "../controllers/employeeAuth.controller.js";
import { requireEmployee } from "../middleware/requireEmployee.js";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/logout-all", requireEmployee, logoutAll);
router.get("/me", requireEmployee, getMe);

export default router;
