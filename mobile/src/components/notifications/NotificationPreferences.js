import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

function Toggle({ on }) {
  return (
    <View style={[styles.track, on && styles.trackOn]}>
      <View style={[styles.thumb, on && styles.thumbOn]} />
    </View>
  );
}

function Row({ label, description, value, onPress, disabled, last }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, !last && styles.rowBorder]}
    >
      <View style={styles.copy}>
        <AppText variant="label" style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Toggle on={value} />
    </Pressable>
  );
}

export default function NotificationPreferences({ values, onChange, disabled }) {
  const rows = [
    { key: "pushEnabled", label: "Push notifications", description: "Receive alerts on this device" },
    { key: "salaryReminderEnabled", label: "Salary reminders", description: "Unpaid finalized salaries" },
    { key: "salaryPaidEnabled", label: "Salary paid", description: "When a salary payment is recorded" },
    { key: "leaveUpdatesEnabled", label: "Leave updates", description: "Submitted, approved, rejected, or cancelled leave" },
    { key: "subscriptionRemindersEnabled", label: "Subscription reminders", description: "Expiry reminders for HelperBook" },
  ];

  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <Row
          key={row.key}
          label={row.label}
          description={row.description}
          value={Boolean(values?.[row.key])}
          disabled={disabled}
          last={index === rows.length - 1}
          onPress={() => onChange(row.key, !values?.[row.key])}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  label: {
    fontWeight: "700",
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.disabled,
    padding: 3,
    justifyContent: "center",
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  thumbOn: {
    alignSelf: "flex-end",
  },
});
