import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
  updateEmployeeLoginStatus,
  updateEmployeeStatus,
} from "../controllers/employee.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployee);
router.put("/:id", updateEmployee);
router.patch("/:id/status", updateEmployeeStatus);
router.patch("/:id/login-status", updateEmployeeLoginStatus);
router.delete("/:id", deleteEmployee);

export default router;
