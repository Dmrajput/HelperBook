import { Router } from "express";
import {
  getForEmployee,
  getHistory,
  getLeaves,
  getOne,
  postApprove,
  postCancel,
  postLeave,
  postRecordLeave,
  postReject,
} from "../controllers/leave.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", getLeaves);
router.post("/", postLeave);
router.post("/record", postRecordLeave);
router.get("/history", getHistory);
router.get("/employee/:employeeId", getForEmployee);
router.get("/:id", getOne);
router.post("/:id/approve", postApprove);
router.post("/:id/reject", postReject);
router.post("/:id/cancel", postCancel);

export default router;
