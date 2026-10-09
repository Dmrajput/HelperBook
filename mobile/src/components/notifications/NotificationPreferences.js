import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

function Row({ label, description, value, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.copy}>
        <AppText variant="subtitle">{label}</AppText>
        {description ? (
          <AppText variant="body" color={colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>
      <AppText variant="label" color={value ? colors.primary : colors.textSecondary}>
        {value ? "ON" : "OFF"}
      </AppText>
    </Pressable>
  );
}

export default function NotificationPreferences({ values, onChange, disabled }) {
  const rows = [
    { key: "pushEnabled", label: "Push Notifications", description: "Receive alerts on this device" },
    { key: "salaryReminderEnabled", label: "Salary Reminders", description: "Unpaid finalized salaries" },
    { key: "salaryPaidEnabled", label: "Salary Paid", description: "When a salary payment is recorded" },
    { key: "leaveUpdatesEnabled", label: "Leave Updates", description: "Submitted, approved, rejected, or cancelled leave" },
    { key: "subscriptionRemindersEnabled", label: "Subscription Reminders", description: "Expiry reminders for HelperBook" },
  ];
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <Row
          key={row.key}
          label={row.label}
          description={row.description}
          value={Boolean(values?.[row.key])}
          disabled={disabled}
          onPress={() => onChange(row.key, !values?.[row.key])}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: { flex: 1, gap: spacing.xs },
});
