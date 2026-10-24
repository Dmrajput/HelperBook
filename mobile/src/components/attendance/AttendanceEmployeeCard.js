import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { roleLabel } from "../../utils/employeeFormat";
import AttendanceStatusSelector from "./AttendanceStatusSelector";

export default function AttendanceEmployeeCard({ employee, date, value, notes, onChange, disabled }) {
  const navigation = useNavigation();
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
          <AppText variant="label" numberOfLines={1} style={styles.name}>
            {employee.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {employee.employeeStatus === "inactive" ? `${role} · Inactive` : role}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View attendance record for ${employee.name}`}
          onPress={() =>
            navigation.navigate("EmployeeAttendance", {
              employeeId: employee.employeeId,
              name: employee.name,
            })
          }
          style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]}
        >
          <Ionicons name="calendar-outline" size={15} color={colors.primary} />
          <AppText variant="caption" color={colors.primary} style={styles.recordLabel}>
            Records
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
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

      {!locked ? (
        <View style={styles.noteField}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.placeholder} />
          <TextInput
            value={notes}
            onChangeText={(nextNotes) => onChange({ status: value, notes: nextNotes })}
            placeholder="Add note (optional)"
            placeholderTextColor={colors.placeholder}
            editable={!disabled}
            maxLength={500}
            style={styles.noteInput}
            accessibilityLabel="Attendance note"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMuted: {
    backgroundColor: colors.disabled,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  recordLabel: {
    fontWeight: "700",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.88,
  },
  noteField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: spacing.md,
  },
  noteInput: {
    flex: 1,
    minHeight: 44,
    color: colors.text,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
});
