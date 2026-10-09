import { Router } from "express";
import {
  cancel,
  checkout,
  history,
  payments,
  readMine,
  readPlans,
  resume,
  updatePlan,
  verify,
  webhook,
} from "../controllers/subscription.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/webhook", webhook);
router.use(requireAuth);
router.get("/plans", readPlans);
router.get("/me", readMine);
router.post("/checkout", checkout);
router.post("/verify-payment", verify);
router.post("/change-plan", updatePlan);
router.post("/cancel", cancel);
router.post("/resume", resume);
router.get("/payments", payments);
router.get("/history", history);

export default router;
