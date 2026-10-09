import { Router } from "express";
import {
  advance,
  advances,
  advanceTransactions,
  attendance,
  attendanceSummary,
  cancelLeave,
  createLeave,
  deletePushToken,
  home,
  leave,
  leaves,
  notifications,
  preferences,
  profile,
  readAllNotifications,
  readNotification,
  receipt,
  receiptPdf,
  salaries,
  salary,
  savePreferences,
  savePushToken,
} from "../controllers/employeePortal.controller.js";
import { requireEmployee } from "../middleware/requireEmployee.js";

const router = Router();

router.use(requireEmployee);
router.get("/profile", profile);
router.get("/home", home);
router.get("/attendance", attendance);
router.get("/attendance/summary", attendanceSummary);
router.get("/salary", salaries);
router.get("/salary/:salaryId/receipt/pdf", receiptPdf);
router.get("/salary/:salaryId/receipt", receipt);
router.get("/salary/:salaryId", salary);
router.get("/advances", advances);
router.get("/advances/:id", advance);
router.get("/advance-transactions", advanceTransactions);
router.post("/leaves", createLeave);
router.get("/leaves", leaves);
router.get("/leaves/:id", leave);
router.post("/leaves/:id/cancel", cancelLeave);
router.get("/notifications", notifications);
router.patch("/notifications/:id/read", readNotification);
router.post("/notifications/read-all", readAllNotifications);
router.post("/push-token", savePushToken);
router.delete("/push-token", deletePushToken);
router.get("/preferences", preferences);
router.put("/preferences", savePreferences);

export default router;
