import { Router } from "express";
import {
  createShop,
  deleteLogo,
  getMyShop,
  updateMyShop,
  uploadLogo,
} from "../controllers/shop.controller.js";
import { logoUpload } from "../middleware/logoUpload.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.post("/", createShop);
router.get("/me", getMyShop);
router.put("/me", updateMyShop);
router.post("/me/logo", logoUpload, uploadLogo);
router.delete("/me/logo", deleteLogo);

export default router;
