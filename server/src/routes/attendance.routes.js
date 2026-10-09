import { Router } from "express";
import {
  createAttendance,
  createBulkAttendance,
  editAttendance,
  getByDate,
  getEmployeeHistory,
  getHistory,
  getMonth,
} from "../controllers/attendance.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/date/:date", getByDate);
router.get("/month/:year/:month", getMonth);
router.get("/history", getHistory);
router.get("/employee/:employeeId", getEmployeeHistory);
router.post("/bulk", createBulkAttendance);
router.post("/", createAttendance);
router.put("/:id", editAttendance);

export default router;
