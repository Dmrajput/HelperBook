import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, keyFromPickerDate, pickerDateFromKey, shiftKey } from "../../utils/attendanceFormat";

function DateField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Previous ${label}`}
          onPress={() => onChange(shiftKey(value, -1))}
          style={styles.arrow}
        >
          <AppText variant="label">←</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${formatAttendanceDate(value)}`}
          onPress={() => setOpen(true)}
          style={styles.date}
        >
          <AppText variant="label">{formatAttendanceDate(value)}</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Next ${label}`}
          onPress={() => onChange(shiftKey(value, 1))}
          style={styles.arrow}
        >
          <AppText variant="label">→</AppText>
        </Pressable>
      </View>
      {open ? (
        <DateTimePicker
          value={pickerDateFromKey(value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            if (Platform.OS !== "ios") setOpen(false);
            if (event.type === "dismissed" || !selected) return;
            onChange(keyFromPickerDate(selected));
          }}
        />
      ) : null}
      {open && Platform.OS === "ios" ? <AppButton label="Done" variant="secondary" onPress={() => setOpen(false)} /> : null}
    </View>
  );
}

export default function LeaveDateRangePicker({ startDate, endDate, onChange }) {
  return (
    <View style={styles.wrap}>
      <DateField label="Start date" value={startDate} onChange={(next) => onChange({ startDate: next, endDate: next > endDate ? next : endDate })} />
      <DateField label="End date" value={endDate} onChange={(next) => onChange({ startDate: next < startDate ? next : startDate, endDate: next })} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  field: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  arrow: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
