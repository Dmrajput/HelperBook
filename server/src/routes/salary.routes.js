import { Router } from "express";
import {
  getEmployeeHistory,
  getMonth,
  getOne,
  getPaymentDetail,
  getPayments,
  patchSalary,
  postCalculate,
  postCalculateAll,
  postFinalize,
  postPaySalary,
  postRecalculate,
  postReopen,
  postReversePayment,
} from "../controllers/salary.controller.js";
import { getReceipt, getReceiptPdf } from "../controllers/salaryReceipt.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/month/:year/:month", getMonth);
router.get("/employee/:employeeId", getEmployeeHistory);
router.post("/calculate-all", postCalculateAll);
router.post("/calculate", postCalculate);
router.get("/payments", getPayments);
router.get("/payments/:paymentId", getPaymentDetail);
router.post("/payments/:paymentId/reverse", postReversePayment);
router.post("/:id/pay", postPaySalary);
router.post("/:id/recalculate", postRecalculate);
router.post("/:id/finalize", postFinalize);
router.post("/:id/reopen", postReopen);
router.get("/:id/receipt/pdf", getReceiptPdf);
router.get("/:id/receipt", getReceipt);
router.patch("/:id", patchSalary);
router.get("/:id", getOne);

export default router;
