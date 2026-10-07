import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import employeeRoutes from "./employee.routes.js";
import healthRoutes from "./health.routes.js";
import shopRoutes from "./shop.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/shops", shopRoutes);
router.use("/employees", employeeRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
