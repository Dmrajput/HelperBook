import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import LeaveCard from "../../components/leave/LeaveCard";
import LeaveEmptyState from "../../components/leave/LeaveEmptyState";
import LeaveSummaryCard from "../../components/leave/LeaveSummaryCard";
import AppScreen from "../../components/AppScreen";
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
  const employeeId = route.params?.employeeId || "";
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const next = employeeId
        ? await getEmployeeLeaves(employeeId, { status, limit: 20 })
        : await getLeaveHistory({ status, limit: 20 });
      setData(next);
    } catch (loadError) {
      setError(loadError.message || "Unable to load leave requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [employeeId, status]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const title = data?.employee?.name ? `${data.employee.name} leave` : "Leave history";

  return (
    <AppScreen title={title} subtitle="Approved and past leave" icon="calendar">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const selected = status === item.id;
            return (
              <Pressable
                key={item.id || "all"}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setStatus(item.id)}
                style={[styles.filter, selected && styles.selected]}
              >
                <AppText variant="caption" color={selected ? colors.textInverse : colors.text}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {loading && !data ? <View style={styles.block} accessibilityLabel="Loading leave history" /> : null}
        {error && !data ? <ErrorView message={error} onRetry={load} /> : null}
        {employeeId && data?.summary ? <LeaveSummaryCard summary={data.summary} title="Approved leave used" /> : null}
        {data && data.leaves.length === 0 ? (
          <LeaveEmptyState
            title={employeeId ? "No leave records for this employee." : "No leave history"}
            message={employeeId ? "" : "Leave records will appear here."}
          />
        ) : null}
        {data?.leaves.map((leave) => (
          <LeaveCard key={leave.id} leave={leave} onPress={() => navigation.navigate("LeaveDetail", { leaveId: leave.id })} />
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filter: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  block: { height: 120, borderRadius: 12, backgroundColor: colors.disabled },
});
