import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { lastPushData, listenForPushEvents, setupPushNotifications } from "../services/pushNotificationService";
import { consumeQueuedNotification, navigateFromNotification, queueNotificationNavigation } from "../utils/notificationNavigation";

let openedInitialPush = false;

export default function usePushNotifications() {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    setupPushNotifications().catch(() => {});
    if (!openedInitialPush) {
      openedInitialPush = true;
      lastPushData().then((data) => {
        if (active && data) navigateFromNotification(navigation, data, user?.role);
      });
    }
    const queued = consumeQueuedNotification();
    if (queued) navigateFromNotification(navigation, queued, user?.role);
    const stop = listenForPushEvents({
      onTap: (data) => {
        if (isAuthenticated) navigateFromNotification(navigation, data, user?.role);
        else queueNotificationNavigation(data);
      },
    });
    return () => {
      active = false;
      stop();
    };
  }, [isAuthenticated, navigation, user?.role]);
}
