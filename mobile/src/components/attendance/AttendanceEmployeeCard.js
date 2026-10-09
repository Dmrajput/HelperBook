import { useState } from "react";
import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import { colors, spacing } from "../../theme";
import { roleLabel } from "../../utils/employeeFormat";
import { statusLabel } from "../../utils/attendanceFormat";
import AttendanceStatusSelector from "./AttendanceStatusSelector";

export default function AttendanceEmployeeCard({ employee, date, value, notes, onChange, disabled }) {
  const [showNote, setShowNote] = useState(Boolean(notes));
  const beforeJoining = employee.joiningDate && date < employee.joiningDate;
  const approvedLeave = employee.leaveSource === "leave";
  const locked = disabled || beforeJoining || approvedLeave;

  return (
    <View style={styles.card}>
      <AppText variant="label">{employee.name}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {roleLabel(employee)}
        {employee.employeeStatus === "inactive" ? " · Inactive" : ""}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {beforeJoining
          ? "Before joining date"
          : approvedLeave
            ? "Approved leave. Cancel the leave before marking attendance."
            : statusLabel(value)}
      </AppText>
      <AttendanceStatusSelector
        value={value}
        disabled={locked}
        onChange={(status) => onChange({ status, notes })}
      />
      {locked ? null : (
        <AppText
          variant="caption"
          color={colors.primary}
          accessibilityRole="button"
          onPress={() => setShowNote((current) => !current)}
        >
          {showNote ? "Hide note" : notes ? "Edit note" : "Add note"}
        </AppText>
      )}
      {showNote && !locked ? (
        <AppTextInput
          label="Reason / Note"
          value={notes}
          onChangeText={(nextNotes) => onChange({ status: value, notes: nextNotes })}
          multiline
          maxLength={500}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
