import { useState } from "react";
import { ScrollView, StyleSheet, TextInput } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ScreenContainer from "../../components/ScreenContainer";
import LeaveDateRangePicker from "../../components/leave/LeaveDateRangePicker";
import LeaveTypeSelector from "../../components/leave/LeaveTypeSelector";
import { createEmployeeLeave } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { todayKey } from "../../utils/attendanceFormat";

export default function EmployeeCreateLeaveScreen({ navigation }) {
  const today = todayKey();
  const [leaveType, setLeaveType] = useState("paid");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await createEmployeeLeave({ leaveType, startDate, endDate, reason });
      navigation.replace("EmployeeLeaveDetail", { leaveId: result.leave.id });
    } catch (submitError) {
      setError(submitError?.message || "Unable to send the leave request.");
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="title">Request Leave</AppText>
        <LeaveTypeSelector value={leaveType} onChange={setLeaveType} />
        <LeaveDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={({ startDate: nextStart, endDate: nextEnd }) => {
            setStartDate(nextStart);
            setEndDate(nextEnd);
          }}
        />
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Reason"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          accessibilityLabel="Leave reason"
        />
        {error ? <AppText variant="body" color={colors.error}>{error}</AppText> : null}
        <AppButton label={loading ? "Sending..." : "Submit Request"} onPress={submit} loading={loading} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
});
