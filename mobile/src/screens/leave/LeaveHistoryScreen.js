import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import LeaveCard from "../../components/leave/LeaveCard";
import LeaveEmptyState from "../../components/leave/LeaveEmptyState";
import LeaveSummaryCard from "../../components/leave/LeaveSummaryCard";
import { getEmployeeLeaves, getLeaveHistory } from "../../services/leaveService";
import { colors, spacing } from "../../theme";

const FILTERS = [
  { id: "", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
  { id: "pending", label: "Pending" },
];

export default function LeaveHistoryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const employeeId = route.params?.employeeId || "";
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (isRefresh = false) => {
      setError("");
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const next = employeeId
          ? await getEmployeeLeaves(employeeId, { status, limit: 20 })
          : await getLeaveHistory({ status, limit: 20 });
        setData(next);
      } catch (loadError) {
        setError(loadError.message || "Unable to load leave requests. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [employeeId, status]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const title = data?.employee?.name ? `${data.employee.name}` : "Leave history";
  const subtitle = data?.employee?.name ? "Employee leave records" : "Approved and past leave";
  const leaves = data?.leaves || [];

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
              {title}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="time-outline" size={20} color="#EA580C" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabTrack}>
          {FILTERS.map((item) => {
            const selected = status === item.id;
            return (
              <Pressable
                key={item.id || "all"}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setStatus(item.id)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <AppText
                  variant="caption"
                  color={selected ? colors.primary : colors.textSecondary}
                  style={styles.tabLabel}
                  numberOfLines={1}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {loading && !data ? (
          <View style={styles.skeleton} accessibilityLabel="Loading leave history">
            <View style={styles.block} />
            <View style={styles.block} />
          </View>
        ) : null}
        {error && !data ? <ErrorView message={error} onRetry={() => load(false)} /> : null}

        {employeeId && data?.summary ? (
          <LeaveSummaryCard summary={data.summary} title="Approved leave used" />
        ) : null}

        {data ? (
          <View style={styles.sectionHeader}>
            <AppText variant="label" style={styles.sectionTitle}>
              Records
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {`${leaves.length} shown`}
            </AppText>
          </View>
        ) : null}

        {data && leaves.length === 0 ? (
          <LeaveEmptyState
            title={employeeId ? "No leave records for this employee." : "No leave history"}
            message={employeeId ? "" : "Leave records will appear here."}
          />
        ) : null}

        {leaves.map((leave) => (
          <LeaveCard
            key={leave.id}
            leave={leave}
            onPress={() => navigation.navigate("LeaveDetail", { leaveId: leave.id })}
          />
        ))}
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
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tabTrack: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1,
  },
  tabSelected: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tabLabel: {
    fontWeight: "700",
    fontSize: 10,
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
  skeleton: { gap: spacing.md },
  block: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
});
