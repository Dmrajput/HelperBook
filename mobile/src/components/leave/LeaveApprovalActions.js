import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { leaveTypeLabel } from "./LeaveTypeBadge";

export default function LeaveApprovalActions({ leave, busy, onApprove, onReject, onCancel }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const pending = leave.status === "pending";
  const canCancel = leave.status === "pending" || leave.status === "approved";

  function approve() {
    Alert.alert(
      "Approve Leave?",
      `${leave.employeeName}\n${leaveTypeLabel(leave.leaveType)}\n${formatAttendanceDate(leave.startDate)} – ${formatAttendanceDate(leave.endDate)}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Approve", onPress: () => onApprove(false) },
      ]
    );
  }

  function reject() {
    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setError("");
    Alert.alert("Reject Leave?", "This request will stay in the leave history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject Leave", style: "destructive", onPress: () => onReject(reason.trim()) },
    ]);
  }

  function cancelLeave() {
    const message = leave.status === "approved"
      ? "This may affect attendance and salary calculations."
      : "This request will stay in the leave history.";
    Alert.alert(leave.status === "approved" ? "Cancel this approved leave?" : "Cancel this leave request?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm Cancellation", style: "destructive", onPress: onCancel },
    ]);
  }

  return (
    <View style={styles.wrap}>
      {pending ? (
        <>
          <AppButton label="Approve" onPress={approve} loading={busy === "approve"} disabled={Boolean(busy)} />
          <AppTextInput label="Rejection reason" value={reason} onChangeText={setReason} placeholder="Shop is short-staffed" />
          {error ? (
            <AppText variant="caption" color={colors.error}>
              {error}
            </AppText>
          ) : null}
          <AppButton label="Reject" variant="secondary" onPress={reject} loading={busy === "reject"} disabled={Boolean(busy)} />
        </>
      ) : null}
      {canCancel ? (
        <AppButton label="Cancel Leave" variant="secondary" onPress={cancelLeave} loading={busy === "cancel"} disabled={Boolean(busy)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
});
