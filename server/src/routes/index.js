import { Router } from "express";
import adminRoutes from "./admin/index.js";
import advanceRoutes from "./advance.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import employeeAuthRoutes from "./employee-auth.routes.js";
import employeePortalRoutes from "./employee-portal.routes.js";
import employeeRoutes from "./employee.routes.js";
import healthRoutes from "./health.routes.js";
import leaveRoutes from "./leave.routes.js";
import notificationRoutes from "./notification.routes.js";
import reportRoutes from "./report.routes.js";
import salaryRoutes from "./salary.routes.js";
import shopRoutes from "./shop.routes.js";
import supportRoutes from "./support.routes.js";
import subscriptionRoutes from "./subscription.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/shops", shopRoutes);
router.use("/employees", employeeRoutes);
router.use("/employee-auth", employeeAuthRoutes);
router.use("/employee-portal", employeePortalRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/advances", advanceRoutes);
router.use("/leaves", leaveRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/salaries", salaryRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/admin", adminRoutes);
router.use("/support", supportRoutes);

export default router;
