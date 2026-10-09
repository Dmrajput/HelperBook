import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import { colors, spacing } from "../../theme";
import { roleLabel } from "../../utils/employeeFormat";
import AttendanceStatusSelector from "./AttendanceStatusSelector";

export default function AttendanceEmployeeCard({ employee, date, value, notes, onChange, disabled }) {
  const [showNote, setShowNote] = useState(Boolean(notes));
  const beforeJoining = employee.joiningDate && date < employee.joiningDate;
  const approvedLeave = employee.leaveSource === "leave";
  const locked = disabled || beforeJoining || approvedLeave;
  const initial = String(employee.name || "A").trim().charAt(0).toUpperCase() || "A";
  const role = roleLabel(employee) || "Staff";
  const lockMessage = beforeJoining
    ? "Joined after this date"
    : approvedLeave
      ? "Approved leave. Cancel the leave before changing attendance."
      : "";

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.avatar, locked && styles.avatarMuted]}>
          <AppText variant="label" color={locked ? colors.textSecondary : colors.primary}>
            {initial}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="label" numberOfLines={1}>
            {employee.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {employee.employeeStatus === "inactive" ? `${role} · Inactive` : role}
          </AppText>
        </View>
        {locked ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showNote ? "Hide note" : notes ? "Edit note" : "Add note"}
            onPress={() => setShowNote((current) => !current)}
            style={styles.noteButton}
          >
            <Ionicons name={notes ? "document-text" : "document-text-outline"} size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {lockMessage ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {lockMessage}
        </AppText>
      ) : null}
      <AttendanceStatusSelector
        value={value}
        disabled={locked}
        onChange={(status) => onChange({ status, notes })}
      />
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
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMuted: {
    backgroundColor: colors.disabled,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  noteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
});
