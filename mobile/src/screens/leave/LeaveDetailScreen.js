import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import LeaveApprovalActions from "../../components/leave/LeaveApprovalActions";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import { leaveTypeLabel } from "../../components/leave/LeaveTypeBadge";
import ScreenContainer from "../../components/ScreenContainer";
import { approveLeave, cancelLeave, getLeave, rejectLeave } from "../../services/leaveService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

export default function LeaveDetailScreen({ navigation, route }) {
  const { leaveId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getLeave(leaveId));
    } catch (loadError) {
      setError(loadError.message || "Unable to load leave requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [leaveId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const leave = data?.leave;

  async function approve(resolveAttendance) {
    setBusy("approve");
    setNotice("");
    try {
      const result = await approveLeave(leave.id, { resolveAttendance });
      setData(result);
      setNotice(result.salaryWarning || "Leave approved successfully.");
    } catch (actionError) {
      const message = actionError.message || "Unable to approve leave. Please try again.";
      if (!resolveAttendance && /already marked/i.test(message)) {
        Alert.alert("Attendance conflict", `${message}\n\nApprove leave and change that attendance to Leave?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Approve", onPress: () => approve(true) },
        ]);
      } else {
        setError(message);
      }
    } finally {
      setBusy("");
    }
  }

  async function reject(reason) {
    setBusy("reject");
    try {
      setData(await rejectLeave(leave.id, reason));
      setNotice("Leave rejected.");
    } catch (actionError) {
      setError(actionError.message || "Unable to reject leave. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function cancel() {
    setBusy("cancel");
    try {
      const result = await cancelLeave(leave.id);
      setData(result);
      setNotice(result.attendanceWarning || "Leave cancelled.");
    } catch (actionError) {
      setError(actionError.message || "Unable to cancel leave. Please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="heading">Leave</AppText>
        {loading && !leave ? <View style={styles.block} accessibilityLabel="Loading leave" /> : null}
        {error && !leave ? <ErrorView message={error} onRetry={load} /> : null}
        {leave ? (
          <View style={styles.card}>
            <AppText variant="subtitle">{leave.employeeName}</AppText>
            <LeaveStatusBadge status={leave.status} />
            <AppText variant="body">{leaveTypeLabel(leave.leaveType)}</AppText>
            <AppText variant="body">
              {formatAttendanceDate(leave.startDate)} → {formatAttendanceDate(leave.endDate)}
            </AppText>
            <AppText variant="body">{leave.totalDays} days</AppText>
            <AppText variant="body">Salary treatment {leave.salaryTreatment === "paid" ? "Paid" : "Unpaid"}</AppText>
            <AppText variant="body">Reason {leave.reason || "Not added"}</AppText>
            {leave.rejectionReason ? <AppText variant="body">Rejection reason {leave.rejectionReason}</AppText> : null}
            <LeaveApprovalActions
              leave={leave}
              busy={busy}
              onApprove={approve}
              onReject={reject}
              onCancel={cancel}
            />
          </View>
        ) : null}
        {notice ? <AppText variant="body">{notice}</AppText> : null}
        <FieldError message={leave ? error : ""} />
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { height: 140, borderRadius: 12, backgroundColor: colors.disabled },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
