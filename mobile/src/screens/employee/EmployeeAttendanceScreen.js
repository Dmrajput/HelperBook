import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import { getEmployeeAttendance } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatMonth, statusLabel, todayKey } from "../../utils/attendanceFormat";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const LEGEND = [
  { key: "present", label: "Present", color: colors.success },
  { key: "absent", label: "Absent", color: colors.error },
  { key: "half_day", label: "Half Day", color: colors.warning },
  { key: "leave", label: "Leave", color: colors.info },
];

const STATUS_META = {
  present: {
    color: colors.success,
    background: colors.successBackground,
    icon: "checkmark",
    badge: "Full Day",
    detail: "You were marked present on this day.",
  },
  absent: {
    color: colors.error,
    background: colors.errorBackground,
    icon: "close",
    badge: "Absent",
    detail: "You were marked absent on this day.",
  },
  half_day: {
    color: colors.warning,
    background: colors.warningBackground,
    icon: "time",
    badge: "Half Day",
    detail: "You were marked half day on this day.",
  },
  leave: {
    color: colors.info,
    background: colors.infoBackground,
    icon: "calendar",
    badge: "Leave",
    detail: "You were on leave on this day.",
  },
  not_marked: {
    color: colors.textSecondary,
    background: colors.disabled,
    icon: "time-outline",
    badge: "Pending",
    detail: "No attendance record for this day.",
  },
};

function shiftMonth(month, delta) {
  const [year, value] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, value - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function sundayOffset(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function formatLongDay(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatShortDay(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function SummaryTile({ label, value, icon, color, background }) {
  return (
    <View style={[styles.summaryTile, { backgroundColor: background }]}>
      <Ionicons name={icon} size={14} color={color} />
      <AppText variant="heading" style={[styles.summaryValue, { color }]}>
        {String(value ?? 0)}
      </AppText>
      <AppText variant="caption" color={color} numberOfLines={1} align="center" style={styles.summaryLabel}>
        {label}
      </AppText>
    </View>
  );
}

export default function EmployeeAttendanceScreen({ navigation, embedded = false }) {
  const insets = useSafeAreaInsets();
  const today = todayKey();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getEmployeeAttendance(month));
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const [year, monthNumber] = month.split("-").map(Number);
  const summary = data?.summary || { present: 0, absent: 0, halfDay: 0, leave: 0 };
  const byDate = useMemo(() => new Map((data?.records || []).map((day) => [day.date, day])), [data?.records]);

  const monthLabel = formatMonth(year, monthNumber);
  const canGoBack = !embedded && typeof navigation?.canGoBack === "function" && navigation.canGoBack();

  // Keep selected date inside the visible month when month changes.
  const effectiveSelected = selectedDate.startsWith(month) ? selectedDate : `${month}-01`;
  const selectedStatus = byDate.get(effectiveSelected)?.status || (effectiveSelected > today ? null : "not_marked");
  const selectedMeta = selectedStatus ? STATUS_META[selectedStatus] || STATUS_META.not_marked : null;

  const historyItems = useMemo(() => {
    const total = daysInMonth(year, monthNumber);
    const items = [];
    for (let day = total; day >= 1; day -= 1) {
      const key = `${month}-${String(day).padStart(2, "0")}`;
      if (key > today) continue;
      const status = byDate.get(key)?.status || "not_marked";
      items.push({ date: key, status });
    }
    return items;
  }, [year, monthNumber, month, today, byDate]);

  const visibleHistory = showAllHistory ? historyItems : historyItems.slice(0, 6);

  const calendarCells = useMemo(() => {
    const count = daysInMonth(year, monthNumber);
    const offset = sundayOffset(year, monthNumber);
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [year, monthNumber]);

  function changeMonth(delta) {
    const next = shiftMonth(month, delta);
    setMonth(next);
    setShowAllHistory(false);
    if (next === today.slice(0, 7)) {
      setSelectedDate(today);
    } else {
      setSelectedDate(`${next}-01`);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.textInverse} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.headerRow}>
            {canGoBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => navigation.goBack()}
                style={styles.headerBtn}
              >
                <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
              </Pressable>
            ) : (
              <View style={styles.headerBtnSpacer} />
            )}
            <View style={styles.headerCopy}>
              <AppText variant="heading" color={colors.textInverse} style={styles.headerTitle}>
                Attendance
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.85)">
                {monthLabel}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to today"
              onPress={() => {
                setMonth(today.slice(0, 7));
                setSelectedDate(today);
              }}
              style={styles.headerBtn}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textInverse} />
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <SummaryTile label="Present" value={summary.present} icon="person" color={colors.success} background={colors.successBackground} />
            <SummaryTile label="Absent" value={summary.absent} icon="close-circle" color={colors.error} background={colors.errorBackground} />
            <SummaryTile label="Half Day" value={summary.halfDay} icon="time" color={colors.warning} background={colors.warningBackground} />
            <SummaryTile label="Leave" value={summary.leave} icon="calendar" color={colors.info} background={colors.infoBackground} />
          </View>
        </View>

        <View style={styles.body}>
          {error ? <ErrorView message={error} onRetry={load} /> : null}

          <View style={styles.card}>
            <View style={styles.monthNav}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthBtn}>
                <Ionicons name="chevron-back" size={18} color={colors.primary} />
              </Pressable>
              <AppText variant="label" style={styles.monthTitle}>
                {monthLabel}
              </AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.monthBtn}>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day, index) => (
                <AppText key={`${day}-${index}`} variant="caption" color={colors.textSecondary} style={styles.weekday} align="center">
                  {day}
                </AppText>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarCells.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.cell} />;
                }
                const key = `${month}-${String(day).padStart(2, "0")}`;
                const status = byDate.get(key)?.status;
                const future = key > today;
                const selected = key === effectiveSelected;
                const statusColor = status ? (STATUS_META[status] || STATUS_META.not_marked).color : null;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`${day}, ${statusLabel(status)}`}
                    accessibilityState={{ selected, disabled: future }}
                    disabled={future}
                    onPress={() => setSelectedDate(key)}
                    style={styles.cell}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        selected && statusColor && { backgroundColor: `${statusColor}22` },
                        selected && !statusColor && { backgroundColor: colors.primaryLight },
                        future && styles.futureDay,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={future ? colors.placeholder : selected && statusColor ? statusColor : colors.text}
                        style={styles.dayNumber}
                      >
                        {day}
                      </AppText>
                    </View>
                    {statusColor ? <View style={[styles.statusDot, { backgroundColor: statusColor }]} /> : <View style={styles.statusDotSpacer} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legend}>
              {LEGEND.map((item) => (
                <View key={item.key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <AppText variant="caption" color={colors.textSecondary}>
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {selectedMeta && effectiveSelected <= today ? (
            <View style={styles.selectedBlock}>
              <AppText variant="caption" color={colors.textSecondary}>
                {formatLongDay(effectiveSelected)}
              </AppText>
              <View style={[styles.detailCard, { backgroundColor: selectedMeta.background }]}>
                <View style={[styles.detailIcon, { backgroundColor: selectedMeta.color }]}>
                  <Ionicons name={selectedMeta.icon} size={18} color={colors.textInverse} />
                </View>
                <View style={styles.detailCopy}>
                  <AppText variant="subtitle" color={selectedMeta.color} style={styles.detailTitle}>
                    {statusLabel(selectedStatus === "not_marked" ? null : selectedStatus)}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {selectedMeta.detail}
                  </AppText>
                </View>
                <View style={[styles.detailBadge, { backgroundColor: colors.surface }]}>
                  <AppText variant="caption" color={selectedMeta.color} style={styles.badgeText}>
                    {selectedMeta.badge}
                  </AppText>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.historyHeader}>
            <AppText variant="label" style={styles.historyTitle}>
              Attendance History
            </AppText>
            {historyItems.length > 6 ? (
              <Pressable accessibilityRole="button" onPress={() => setShowAllHistory((value) => !value)} hitSlop={8}>
                <AppText variant="label" color={colors.primary}>
                  {showAllHistory ? "Show Less" : "View All ›"}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card}>
            {visibleHistory.length ? (
              visibleHistory.map((item, index) => {
                const meta = STATUS_META[item.status] || STATUS_META.not_marked;
                return (
                  <Pressable
                    key={item.date}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatShortDay(item.date)}, ${statusLabel(item.status === "not_marked" ? null : item.status)}`}
                    onPress={() => setSelectedDate(item.date)}
                    style={[styles.historyRow, index > 0 && styles.historyRowBorder]}
                  >
                    <AppText variant="label" style={styles.historyDate}>
                      {formatShortDay(item.date)}
                    </AppText>
                    <View style={[styles.historyIcon, { backgroundColor: meta.background }]}>
                      <Ionicons name={meta.icon} size={14} color={meta.color} />
                    </View>
                    <View style={styles.historyCopy}>
                      <AppText variant="label">
                        {statusLabel(item.status === "not_marked" ? null : item.status)}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {item.status === "not_marked"
                          ? "No attendance record"
                          : item.status === "present"
                            ? "Full Day"
                            : statusLabel(item.status)}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
                  </Pressable>
                );
              })
            ) : (
              <AppText variant="body" color={colors.textSecondary}>
                No attendance history for this month yet.
              </AppText>
            )}
          </View>
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
    paddingBottom: spacing.lg,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnSpacer: {
    width: 40,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  summaryCard: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.sm,
    marginBottom: -44,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  summaryTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    alignItems: "center",
    gap: 2,
    minHeight: 72,
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  summaryLabel: {
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 20,
    gap: spacing.md,
  },
  card: {
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
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekday: {
    width: "14.28%",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 4,
    gap: 2,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontWeight: "600",
  },
  futureDay: {
    opacity: 0.4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotSpacer: {
    width: 6,
    height: 6,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedBlock: {
    gap: spacing.sm,
  },
  detailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 16,
    padding: spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailTitle: {
    fontWeight: "700",
  },
  detailBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontWeight: "700",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyTitle: {
    fontWeight: "700",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
  },
  historyRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  historyDate: {
    width: 52,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  historyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
