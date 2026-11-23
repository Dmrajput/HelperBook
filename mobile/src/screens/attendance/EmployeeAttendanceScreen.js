import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import { colors, spacing } from "../../theme";
import { getEmployeeAttendance } from "../../services/attendanceService";
import { formatAttendanceDate, monthStartKey, statusLabel, todayKey } from "../../utils/attendanceFormat";

const STATUS_META = {
  present: { color: colors.success, background: colors.successBackground },
  absent: { color: colors.error, background: colors.errorBackground },
  half_day: { color: colors.warning, background: colors.warningBackground },
  leave: { color: colors.info, background: colors.infoBackground },
};

const SUMMARY_TILES = [
  { key: "present", label: "Present", color: colors.success },
  { key: "absent", label: "Absent", color: colors.error },
  { key: "halfDay", label: "Half day", color: colors.warning },
  { key: "leave", label: "Leave", color: colors.info },
];

export default function EmployeeAttendanceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { employeeId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const today = todayKey();
        const next = await getEmployeeAttendance(employeeId, {
          startDate: monthStartKey(today),
          endDate: today,
          limit: 31,
        });
        setData(next);
      } catch (loadError) {
        setData(null);
        setError(loadError);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [employeeId]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const name = data?.employee?.name || "Attendance";
  const initial = String(name || "E").trim().charAt(0).toUpperCase() || "E";

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
            <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
              {name}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Attendance this month
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Monthly calendar"
            onPress={() => navigation.navigate("MonthlyAttendance")}
            style={styles.headerAction}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !data ? (
          <View style={styles.skeleton} accessibilityLabel="Loading attendance">
            <View style={styles.block} />
            <View style={styles.block} />
          </View>
        ) : null}
        {error ? (
          <ErrorView
            title="Unable to load attendance."
            message={error.isNetworkError ? "Please check your internet connection and try again." : error.message}
            onRetry={() => load(false)}
          />
        ) : null}

        {data ? (
          <>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <AppText variant="heading" color={colors.primary}>
                  {initial}
                </AppText>
              </View>
              <AppText variant="subtitle" align="center" style={styles.heroName}>
                {name}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} align="center">
                Records from this month so far
              </AppText>
            </View>

            <View style={styles.summaryCard}>
              {SUMMARY_TILES.map((tile, index) => (
                <View key={tile.key} style={[styles.summaryTile, index > 0 && styles.summaryDivider]}>
                  <View style={styles.summaryLabelRow}>
                    <View style={[styles.dot, { backgroundColor: tile.color }]} />
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.summaryLabel}>
                      {tile.label}
                    </AppText>
                  </View>
                  <AppText style={styles.summaryValue}>{String(data.summary[tile.key] ?? 0)}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <AppText variant="label" style={styles.sectionTitle}>
                Records
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {`${data.records.length} days`}
              </AppText>
            </View>
          </>
        ) : null}

        {data && data.records.length === 0 ? (
          <AttendanceEmptyState
            title="No attendance records yet."
            message="Start marking attendance to see history here."
          />
        ) : null}

        {data?.records.map((record) => {
          const meta = STATUS_META[record.status] || {
            color: colors.textSecondary,
            background: "#F1F5F9",
          };
          return (
            <Pressable
              key={record.id}
              accessibilityRole="button"
              accessibilityLabel={`${formatAttendanceDate(record.date)}, ${statusLabel(record.status)}`}
              onPress={() => navigation.navigate("AttendanceDay", { date: record.date })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.rowCopy}>
                <AppText variant="label" style={styles.rowDate} numberOfLines={1}>
                  {formatAttendanceDate(record.date)}
                </AppText>
                {record.notes ? (
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {record.notes}
                  </AppText>
                ) : (
                  <AppText variant="caption" color={colors.textSecondary}>
                    Tap to open day
                  </AppText>
                )}
              </View>
              <View style={[styles.badge, { backgroundColor: meta.background }]}>
                <View style={[styles.dot, { backgroundColor: meta.color }]} />
                <AppText variant="caption" color={meta.color} style={styles.badgeText}>
                  {statusLabel(record.status)}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
            </Pressable>
          );
        })}
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
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroName: {
    fontWeight: "700",
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  summaryTile: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  summaryDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    color: colors.text,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowDate: {
    fontWeight: "700",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 11,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 88,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
