import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import NotificationCard from "../../components/notifications/NotificationCard";
import NotificationEmptyState from "../../components/notifications/NotificationEmptyState";
import AppScreen from "../../components/AppScreen";
import useNotifications from "../../hooks/useNotifications";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, shiftKey, todayKey } from "../../utils/attendanceFormat";
import { navigateFromNotification } from "../../utils/notificationNavigation";

function dayKey(value) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function timeLabel(value) {
  const key = dayKey(value);
  const today = todayKey();
  if (key === today) {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (key === shiftKey(today, -1)) return "Yesterday";
  return formatAttendanceDate(key);
}

function groupLabel(key) {
  if (key === todayKey()) return "Today";
  if (key === shiftKey(todayKey(), -1)) return "Yesterday";
  return "Earlier";
}

export default function NotificationScreen() {
  const navigation = useNavigation();
  const { data, loading, refreshing, error, reload, markRead, markAllRead } = useNotifications();
  const [pageError, setPageError] = useState("");
  const items = data?.notifications || [];
  const groups = [];
  items.forEach((item) => {
    const label = groupLabel(dayKey(item.createdAt));
    const group = groups.find((entry) => entry.label === label);
    if (group) group.items.push(item);
    else groups.push({ label, items: [item] });
  });

  async function openItem(item) {
    setPageError("");
    try {
      if (!item.isRead) await markRead(item.id);
      navigateFromNotification(navigation, item);
    } catch (openError) {
      setPageError(openError.message || "Unable to update notification.");
    }
  }

  async function readAll() {
    setPageError("");
    try {
      await markAllRead();
    } catch (readError) {
      Alert.alert("Notifications", readError.message || "Unable to update notification.");
    }
  }

  return (
    <AppScreen title="Notifications" subtitle="Shop alerts" icon="notifications">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
      >
        {data?.unreadCount > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Mark all as read" onPress={readAll} style={styles.back}>
            <AppText variant="label" color={colors.primary}>
              Mark all as read
            </AppText>
          </Pressable>
        ) : null}
        {pageError ? <AppText color={colors.error}>{pageError}</AppText> : null}
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <ErrorView title="Unable to load notifications." message="Please try again." onRetry={reload} /> : null}
        {!loading && !error && items.length === 0 ? <NotificationEmptyState /> : null}
        {groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <AppText variant="subtitle">{group.label}</AppText>
            {group.items.map((item) => (
              <NotificationCard
                key={item.id}
                type={item.type}
                title={item.title}
                message={item.message}
                time={timeLabel(item.createdAt)}
                unread={!item.isRead}
                onPress={() => openItem(item)}
              />
            ))}
          </View>
        ))}
        {!loading && data?.pagination?.pages > 1 ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Showing page {data.pagination.page} of {data.pagination.pages}
          </AppText>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  group: { gap: spacing.sm },
});
