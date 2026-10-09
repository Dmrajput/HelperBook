import { Router } from "express";
import {
  forgotPassword,
  getMe,
  login,
  logout,
  logoutAll,
  refreshToken,
  resetPassword,
} from "../controllers/employeeAuth.controller.js";
import { requireEmployee } from "../middleware/requireEmployee.js";

const router = Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/logout-all", requireEmployee, logoutAll);
router.get("/me", requireEmployee, getMe);

export default router;
