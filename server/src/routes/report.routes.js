import { Router } from "express";
import {
  exportAdvanceExcel,
  exportAdvancePdf,
  exportAttendanceExcel,
  exportAttendancePdf,
  exportLeaveExcel,
  exportLeavePdf,
  exportPaymentExcel,
  exportPaymentPdf,
  exportSalaryExcel,
  exportSalaryPdf,
  getAdvance,
  getAttendance,
  getLeave,
  getPayments,
  getSalary,
} from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/attendance", getAttendance);
router.get("/attendance/pdf", exportAttendancePdf);
router.get("/attendance/excel", exportAttendanceExcel);

router.get("/salary", getSalary);
router.get("/salary/pdf", exportSalaryPdf);
router.get("/salary/excel", exportSalaryExcel);

router.get("/advance", getAdvance);
router.get("/advance/pdf", exportAdvancePdf);
router.get("/advance/excel", exportAdvanceExcel);

router.get("/leave", getLeave);
router.get("/leave/pdf", exportLeavePdf);
router.get("/leave/excel", exportLeaveExcel);

router.get("/payments", getPayments);
router.get("/payments/pdf", exportPaymentPdf);
router.get("/payments/excel", exportPaymentExcel);

export default router;
