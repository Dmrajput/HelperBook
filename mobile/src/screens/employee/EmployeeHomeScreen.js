import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import { getEmployeeHome, markEmployeeAttendanceToday } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

const STATUS_COPY = {
  present: { title: "You're present today", subtitle: "Attendance marked for today", tone: "success" },
  absent: { title: "Marked absent today", subtitle: "Contact your shop if this looks wrong", tone: "danger" },
  half_day: { title: "Half day today", subtitle: "Attendance marked for today", tone: "warning" },
  leave: { title: "On leave today", subtitle: "Enjoy your day off", tone: "info" },
  not_marked: { title: "Today's Attendance", subtitle: "Mark your attendance for today", tone: "primary" },
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

function SectionCard({ title, icon, actionLabel, onAction, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIcon}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
          <AppText variant="label" style={styles.sectionTitle} numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} hitSlop={8}>
            <AppText variant="label" color={colors.primary}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function StatTile({ label, value, icon, color, background }) {
  return (
    <View style={[styles.statTile, { backgroundColor: background }]}>
      <Ionicons name={icon} size={15} color={color} />
      <AppText variant="heading" style={[styles.statValue, { color }]}>
        {String(value ?? 0)}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} align="center">
        {label}
      </AppText>
    </View>
  );
}

function PrimaryChip({ label, onPress, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryChip,
        pressed && !disabled && styles.pressed,
        disabled && styles.primaryChipDisabled,
      ]}
    >
      <AppText variant="label" color={disabled ? colors.disabledText : colors.textInverse} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function EmployeeHomeScreen({ navigation, onOpenTab }) {
  const insets = useSafeAreaInsets();
  const [home, setHome] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    try {
      setHome(await getEmployeeHome());
      setError("");
    } catch (loadError) {
      setError(loadError?.isNetworkError ? loadError.message : loadError?.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function markToday() {
    if (marking) return;
    setMarking(true);
    try {
      await markEmployeeAttendanceToday();
      await load();
      Alert.alert("Attendance marked", "You are marked present for today.");
    } catch (markError) {
      Alert.alert("Attendance", markError?.message || "Unable to mark attendance.");
      await load();
    } finally {
      setMarking(false);
    }
  }

  if (!home && error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorView message={error} onRetry={load} />
      </View>
    );
  }

  const name = home?.employee?.name || "there";
  const initial = String(name).trim().charAt(0).toUpperCase() || "E";
  const todayStatus = home?.attendanceToday || "not_marked";
  const todayCopy = STATUS_COPY[todayStatus] || STATUS_COPY.not_marked;
  const month = home?.monthAttendance || {};
  const currentSalary = home?.currentSalary;
  const latestSalary = home?.latestSalary;
  const unread = Number(home?.unreadCount) || 0;
  const canMark = Boolean(home?.canMarkToday);

  let latestLabel = "No records yet";
  let latestBadge = null;
  if (latestSalary) {
    if (latestSalary.status !== "finalized") {
      latestLabel = "Not finalized";
      latestBadge = { label: "In Progress", tone: "warning" };
    } else if (latestSalary.paymentStatus === "paid") {
      latestLabel = formatInr(latestSalary.netSalary || latestSalary.finalSalary);
      latestBadge = { label: "Paid", tone: "success" };
    } else {
      latestLabel = formatInr(latestSalary.netSalary || latestSalary.finalSalary);
      latestBadge = { label: "Unpaid", tone: "danger" };
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.textInverse} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerTop}>
            <View style={styles.identity}>
              <View style={styles.avatar}>
                <AppText variant="heading" color={colors.primary} style={styles.avatarLetter}>
                  {initial}
                </AppText>
              </View>
              <View style={styles.identityCopy}>
                <AppText variant="caption" color="rgba(255,255,255,0.85)">
                  {greeting()}
                </AppText>
                <AppText variant="subtitle" color={colors.textInverse} numberOfLines={1} style={styles.name}>
                  {`${name} 👋`}
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={1}>
                  {home?.shop?.name || "Your shop"}
                </AppText>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => navigation.navigate("EmployeeNotifications")}
                style={styles.headerBtn}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.textInverse} />
                {unread > 0 ? <View style={styles.dot} /> : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => onOpenTab?.("Profile")}
                style={styles.headerBtn}
              >
                <Ionicons name="settings-outline" size={20} color={colors.textInverse} />
              </Pressable>
            </View>
          </View>

          <View style={styles.todayCard}>
            <View style={styles.todayIcon}>
              <Ionicons name="calendar" size={22} color={colors.primary} />
            </View>
            <View style={styles.todayCopy}>
              <AppText variant="label" style={styles.todayTitle} numberOfLines={1}>
                {todayCopy.title}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                {todayCopy.subtitle}
              </AppText>
            </View>
            {canMark ? (
              <PrimaryChip label={marking ? "Marking..." : "Mark Now →"} onPress={markToday} disabled={marking} />
            ) : (
              <PrimaryChip label="View →" onPress={() => onOpenTab?.("Attendance")} />
            )}
          </View>
        </View>

        <View style={styles.body}>
          {error ? <ErrorView message={error} onRetry={load} /> : null}

          <SectionCard title="This Month Attendance" icon="calendar-outline" actionLabel="View All ›" onAction={() => onOpenTab?.("Attendance")}>
            <View style={styles.statRow}>
              <StatTile label="Present" value={month.present} icon="person" color={colors.success} background={colors.successBackground} />
              <StatTile label="Absent" value={month.absent} icon="close" color={colors.error} background={colors.errorBackground} />
              <StatTile label="Half Day" value={month.halfDay} icon="time" color={colors.warning} background={colors.warningBackground} />
              <StatTile label="Leave" value={month.leave} icon="calendar" color={colors.info} background={colors.infoBackground} />
            </View>
          </SectionCard>

          <SectionCard title="Salary" icon="wallet-outline" actionLabel="View Details ›" onAction={() => onOpenTab?.("Salary")}>
            <View style={styles.salaryRow}>
              <View style={styles.salaryPanel}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Current Salary
                </AppText>
                <AppText variant="subtitle" style={styles.salaryAmount} numberOfLines={1}>
                  {currentSalary ? formatInr(currentSalary.amount) : "—"}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {currentSalary?.type === "daily" ? "/ day" : "/ month"}
                </AppText>
              </View>
              <Pressable
                style={styles.salaryPanel}
                onPress={() => onOpenTab?.("Salary")}
                accessibilityRole="button"
                accessibilityLabel="Latest salary"
              >
                <AppText variant="caption" color={colors.textSecondary}>
                  Latest Salary
                </AppText>
                <View style={styles.latestRow}>
                  <AppText variant="label" style={styles.salaryAmount} numberOfLines={2}>
                    {latestLabel}
                  </AppText>
                  <Ionicons name="chevron-forward" size={14} color={colors.placeholder} />
                </View>
                {latestBadge ? (
                  <View
                    style={[
                      styles.badge,
                      latestBadge.tone === "success" && styles.badgeSuccess,
                      latestBadge.tone === "warning" && styles.badgeWarning,
                      latestBadge.tone === "danger" && styles.badgeDanger,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={
                        latestBadge.tone === "success"
                          ? colors.success
                          : latestBadge.tone === "danger"
                            ? colors.error
                            : colors.warning
                      }
                      style={styles.badgeText}
                    >
                      {latestBadge.label}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </SectionCard>

          <SectionCard
            title="Advance / Khata"
            icon="layers-outline"
            actionLabel="View Khata ›"
            onAction={() => navigation.navigate("EmployeeAdvance")}
          >
            <View style={styles.advancePanel}>
              <View style={styles.advanceCopy}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Outstanding
                </AppText>
                <AppText variant="heading" style={styles.advanceAmount}>
                  {formatInr(home?.advanceOutstanding || 0)}
                </AppText>
              </View>
              <View style={styles.advanceArt}>
                <Ionicons name="cash-outline" size={28} color={colors.success} />
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Leave" icon="calendar-outline" actionLabel="View Details ›" onAction={() => onOpenTab?.("Leave")}>
            <View style={styles.leaveRow}>
              <View style={styles.leaveCopy}>
                {home?.upcomingLeave ? (
                  <>
                    <AppText variant="label">Upcoming leave</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {`${home.upcomingLeave.startDate} → ${home.upcomingLeave.endDate}`}
                    </AppText>
                    <AppText variant="caption" color={colors.primary}>
                      {home.upcomingLeave.status === "pending" ? "Pending approval" : "Approved"}
                    </AppText>
                  </>
                ) : (
                  <>
                    <AppText variant="label">No upcoming leave</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Request leave in advance
                    </AppText>
                  </>
                )}
              </View>
              <PrimaryChip label="Request Leave →" onPress={() => navigation.navigate("EmployeeCreateLeave")} />
            </View>
          </SectionCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: -36,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  todayIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  todayTitle: {
    fontWeight: "700",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 12,
    gap: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontWeight: "700",
  },
  statRow: {
    flexDirection: "row",
    gap: 6,
  },
  statTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 2,
    minHeight: 78,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  salaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  salaryPanel: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    gap: 4,
  },
  salaryAmount: {
    fontWeight: "700",
  },
  latestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.warningBackground,
  },
  badgeSuccess: {
    backgroundColor: colors.successBackground,
  },
  badgeWarning: {
    backgroundColor: colors.warningBackground,
  },
  badgeDanger: {
    backgroundColor: colors.errorBackground,
  },
  badgeText: {
    fontWeight: "700",
  },
  advancePanel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successBackground,
    borderRadius: 14,
    padding: spacing.md,
  },
  advanceCopy: {
    flex: 1,
    gap: 4,
  },
  advanceAmount: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  advanceArt: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  leaveCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  primaryChip: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 140,
  },
  primaryChipDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
