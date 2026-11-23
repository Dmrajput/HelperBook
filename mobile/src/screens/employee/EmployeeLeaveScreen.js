import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import { leaveTypeLabel } from "../../components/leave/LeaveTypeBadge";
import { getEmployeeLeaves } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";

const FILTERS = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
];

function shortDate(key) {
  if (!key) return "";
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function titleDate(leave) {
  if (leave.startDate === leave.endDate) return shortDate(leave.startDate);
  return `${shortDate(leave.startDate)} – ${shortDate(leave.endDate)}`;
}

export default function EmployeeLeaveScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getEmployeeLeaves(filter || undefined));
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load leave.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const leaves = data?.leaves || [];
  const summary = data?.summary || {};

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Leave
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Your requests
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Request leave"
          onPress={() => navigation.navigate("EmployeeCreateLeave")}
          style={({ pressed }) => [styles.requestBtn, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <AppText variant="label" color={colors.textInverse}>
            Request leave
          </AppText>
        </Pressable>

        <View style={styles.statsCard}>
          <StatCell label="Pending" value={summary.pending || 0} />
          <View style={styles.statDivider} />
          <StatCell label="Approved" value={summary.approved || 0} />
          <View style={styles.statDivider} />
          <StatCell label="Upcoming" value={summary.upcoming || 0} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((item) => {
            const selected = filter === item.id;
            return (
              <Pressable
                key={item.id || "all"}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item.id)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <AppText
                  variant="caption"
                  color={selected ? colors.textInverse : colors.textSecondary}
                  style={styles.chipLabel}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? <ErrorView message={error} onRetry={load} /> : null}

        <View style={styles.sectionHeader}>
          <AppText variant="label" style={styles.sectionTitle}>
            Requests
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {leaves.length ? `${leaves.length} shown` : "None yet"}
          </AppText>
        </View>

        {!loading && !leaves.length && !error ? (
          <View style={styles.empty}>
            <AppText variant="label" style={styles.emptyTitle}>
              No leave requests yet
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              Tap Request leave to submit one.
            </AppText>
          </View>
        ) : null}

        {leaves.map((leave) => (
          <Pressable
            key={leave.id}
            accessibilityRole="button"
            accessibilityLabel={`${titleDate(leave)}, ${leaveTypeLabel(leave.leaveType)}`}
            onPress={() => navigation.navigate("EmployeeLeaveDetail", { leaveId: leave.id })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.cardCopy}>
              <AppText variant="label" style={styles.cardTitle} numberOfLines={1}>
                {titleDate(leave)}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {`${leave.totalDays} ${leave.totalDays === 1 ? "day" : "days"} • ${leaveTypeLabel(leave.leaveType)}`}
              </AppText>
            </View>
            <LeaveStatusBadge status={leave.status} />
            <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function StatCell({ label, value }) {
  return (
    <View style={styles.statCell}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="heading" style={styles.statValue}>
        {String(value)}
      </AppText>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  requestBtn: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontWeight: "700",
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
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  emptyTitle: {
    fontWeight: "700",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTitle: {
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.9,
  },
});
