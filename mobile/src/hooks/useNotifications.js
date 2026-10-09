import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import { setAppBadge } from "../services/pushNotificationService";

export default function useNotifications(enabled = true) {
  const [data, setData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ refresh = false, page = 1 } = {}) => {
      if (!enabled) return;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const next = await getNotifications({ page, limit: 20 });
        setData(next);
        setUnreadCount(next.unreadCount || 0);
        await setAppBadge(next.unreadCount || 0);
      } catch (loadError) {
        setError(loadError.message || "Unable to load notifications. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled]
  );

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
      await setAppBadge(count);
    } catch {
      // The badge stays on the last known count when the request fails.
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function markRead(id) {
    const previous = data;
    const previousCount = unreadCount;
    setData((current) =>
      current
        ? {
            ...current,
            notifications: current.notifications.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
          }
        : current
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(id);
      await setAppBadge(Math.max(0, previousCount - 1));
    } catch (markError) {
      setData(previous);
      setUnreadCount(previousCount);
      throw markError;
    }
  }

  async function markAllRead() {
    const previous = data;
    const previousCount = unreadCount;
    setData((current) =>
      current
        ? { ...current, notifications: current.notifications.map((item) => ({ ...item, isRead: true })), unreadCount: 0 }
        : current
    );
    setUnreadCount(0);
    await setAppBadge(0);
    try {
      await markAllNotificationsRead();
    } catch (markError) {
      setData(previous);
      setUnreadCount(previousCount);
      await setAppBadge(previousCount);
      throw markError;
    }
  }

  return { data, unreadCount, loading, refreshing, error, reload: () => load({ refresh: true }), refreshUnread, markRead, markAllRead, load };
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUnreadCount()
        .then(async (next) => {
          if (!active) return;
          setCount(next);
          await setAppBadge(next);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );
  return count;
}
