import { Router } from "express";
import {
  createDemoRequest,
  createInquiry,
  publicPlans,
  publicPlatform,
} from "../controllers/public.controller.js";

const router = Router();

router.get("/platform", publicPlatform);
router.get("/plans", publicPlans);
router.post("/demo-requests", createDemoRequest);
router.post("/inquiries", createInquiry);

export default router;
