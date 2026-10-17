import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  logoutAll,
  refreshToken,
  resetPassword,
} from "../controllers/employeeAuth.controller.js";
import { requireEmployee } from "../middleware/requireEmployee.js";
import { requestEmployeeAccountDeletion } from "../services/accountDeletion.service.js";
import { assertEmployeePasswordReady } from "../services/employeeAuth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/logout-all", requireEmployee, logoutAll);
router.get("/me", requireEmployee, getMe);
router.post("/change-password", requireEmployee, changePassword);
router.post("/deletion-request", requireEmployee, async (req, res) => {
  assertEmployeePasswordReady(req.employee);
  const data = await requestEmployeeAccountDeletion(req.employee);
  sendSuccess(res, data.alreadyRequested ? "A deletion request is already open." : "Deletion request received.", data, data.alreadyRequested ? 200 : 201);
});

export default router;
