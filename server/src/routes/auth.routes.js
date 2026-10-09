import { Router } from "express";
import {
  forgotPassword,
  getMe,
  login,
  logout,
  logoutAll,
  refreshToken,
  register,
  resetOwnerPassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetOwnerPassword);
router.post("/refresh", refreshToken);
router.post("/logout", requireAuth, logout);
router.post("/logout-all", requireAuth, logoutAll);
router.get("/me", requireAuth, getMe);

export default router;
