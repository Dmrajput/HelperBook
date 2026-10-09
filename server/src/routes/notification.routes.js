import { Router } from "express";
import {
  deletePushToken,
  listNotifications,
  readAllNotifications,
  readNotification,
  readPreferences,
  readSubscriptionStatus,
  savePreferences,
  savePushToken,
  unreadCount,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/unread-count", unreadCount);
router.get("/preferences", readPreferences);
router.put("/preferences", savePreferences);
router.get("/subscription", readSubscriptionStatus);
router.post("/push-token", savePushToken);
router.delete("/push-token", deletePushToken);
router.patch("/read-all", readAllNotifications);
router.get("/", listNotifications);
router.patch("/:id/read", readNotification);

export default router;
