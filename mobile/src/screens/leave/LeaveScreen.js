import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import LeaveCard from "../../components/leave/LeaveCard";
import LeaveEmptyState from "../../components/leave/LeaveEmptyState";
import LeaveSummaryCard from "../../components/leave/LeaveSummaryCard";
import AppScreen from "../../components/AppScreen";
import useLeave from "../../hooks/useLeave";
import { approveLeave, rejectLeave } from "../../services/leaveService";
import { colors, spacing } from "../../theme";

export default function LeaveScreen({ navigation }) {
  const { data, loading, error, reload } = useLeave({ status: "pending" });
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");

  async function approve(leave, resolveAttendance) {
    setBusyId(leave.id);
    setActionError("");
    try {
      const result = await approveLeave(leave.id, { resolveAttendance });
      if (result.salaryWarning) {
        Alert.alert("Leave approved successfully.", result.salaryWarning);
      }
      await reload();
    } catch (approveError) {
      const message = approveError.message || "Unable to approve leave. Please try again.";
      if (!resolveAttendance && /already marked/i.test(message)) {
        Alert.alert("Attendance conflict", `${message}\n\nApprove leave anyway?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Approve", onPress: () => approve(leave, true) },
        ]);
      } else {
        setActionError(message);
      }
    } finally {
      setBusyId("");
    }
  }

  function confirmApprove(leave) {
    Alert.alert("Approve Leave?", `${leave.employeeName}\n${leave.startDate} – ${leave.endDate}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approve(leave, false) },
    ]);
  }

  function confirmReject(leave) {
    navigation.navigate("LeaveDetail", { leaveId: leave.id });
  }

  return (
    <AppScreen title="Leave" subtitle="Review and record staff leave" icon="calendar">
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && !data ? <View style={styles.block} accessibilityLabel="Loading leave" /> : null}
        {error && !data ? (
          <ErrorView title="Unable to load leave requests." message={error} onRetry={reload} />
        ) : null}
        {data ? (
          <>
            <LeaveSummaryCard summary={data.summary} />
            <AppText variant="subtitle">Pending requests {data.summary?.pendingRequests ?? data.total ?? 0}</AppText>
            {data.leaves.length === 0 ? (
              <LeaveEmptyState
                title="No pending leave requests"
                message="All leave requests have been reviewed."
              />
            ) : (
              data.leaves.map((leave) => (
                <View key={leave.id} style={styles.item}>
                  <LeaveCard leave={leave} onPress={() => navigation.navigate("LeaveDetail", { leaveId: leave.id })} />
                  <View style={styles.actions}>
                    <AppButton
                      label="Approve"
                      onPress={() => confirmApprove(leave)}
                      loading={busyId === leave.id}
                      disabled={Boolean(busyId)}
                    />
                    <AppButton label="Reject" variant="secondary" onPress={() => confirmReject(leave)} disabled={Boolean(busyId)} />
                  </View>
                </View>
              ))
            )}
          </>
        ) : null}
        {actionError ? (
          <AppText variant="caption" color={colors.error}>
            {actionError}
          </AppText>
        ) : null}
        <AppButton label="Leave Request" onPress={() => navigation.navigate("CreateLeave", { mode: "request" })} />
        <AppButton
          label="Record Leave"
          variant="secondary"
          onPress={() => navigation.navigate("CreateLeave", { mode: "record" })}
        />
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate("LeaveHistory")}>
          <AppText variant="label" color={colors.primary}>
            Leave history
          </AppText>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { height: 120, borderRadius: 12, backgroundColor: colors.disabled },
  item: { gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm },
});
