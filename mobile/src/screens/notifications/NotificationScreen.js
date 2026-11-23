import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import NotificationCard from "../../components/notifications/NotificationCard";
import NotificationEmptyState from "../../components/notifications/NotificationEmptyState";
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
  const insets = useSafeAreaInsets();
  const { data, loading, refreshing, error, reload, markRead, markAllRead } = useNotifications();
  const [pageError, setPageError] = useState("");
  const items = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
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
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Notifications
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {unreadCount > 0 ? `${unreadCount} unread` : "Shop alerts"}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notification settings"
            onPress={() => navigation.navigate("NotificationSettings")}
            style={styles.headerAction}
          >
            <Ionicons name="settings-outline" size={20} color={colors.info} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            onPress={readAll}
            style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
            <AppText variant="label" color={colors.primary}>
              Mark all as read
            </AppText>
          </Pressable>
        ) : null}

        {pageError ? (
          <AppText variant="caption" color={colors.error}>
            {pageError}
          </AppText>
        ) : null}
        {loading && !data ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <ErrorView title="Unable to load notifications." message="Please try again." onRetry={reload} /> : null}
        {!loading && !error && items.length === 0 ? <NotificationEmptyState /> : null}

        {groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <View style={styles.sectionHeader}>
              <AppText variant="label" style={styles.sectionTitle}>
                {group.label}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {`${group.items.length}`}
              </AppText>
            </View>
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
          <AppText variant="caption" color={colors.textSecondary} align="center">
            Showing page {data.pagination.page} of {data.pagination.pages}
          </AppText>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.infoBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  markAll: {
    alignSelf: "flex-start",
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  group: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  pressed: {
    opacity: 0.9,
  },
});
