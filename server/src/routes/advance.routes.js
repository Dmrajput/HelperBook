import { Router } from "express";
import {
  getForEmployee,
  getList,
  getOne,
  getTransactionsForAdvance,
  getTransactionsForEmployee,
  patchSettings,
  postAdjustment,
  postAdvance,
  postRepayment,
  postReverse,
} from "../controllers/advance.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", getList);
router.post("/", postAdvance);
router.post("/repayment", postRepayment);
router.post("/adjustment", postAdjustment);
router.get("/employee/:employeeId", getForEmployee);
router.get("/transactions/:employeeId", getTransactionsForEmployee);
router.post("/transactions/:transactionId/reverse", postReverse);
router.get("/:id/transactions", getTransactionsForAdvance);
router.patch("/:id", patchSettings);
router.get("/:id", getOne);

export default router;
