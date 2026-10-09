import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, keyFromPickerDate, pickerDateFromKey, shiftKey, todayKey } from "../../utils/attendanceFormat";

export default function AttendanceDateSelector({ date, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const today = todayKey();
  const nextDisabled = shiftKey(date, 1) > today;

  function apply(next) {
    if (!next || next > today) {
      return;
    }
    onChange(next);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          onPress={() => apply(shiftKey(date, -1))}
          style={styles.arrow}
        >
          <AppText variant="label">←</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Attendance date, ${formatAttendanceDate(date)}`}
          onPress={() => setShowPicker(true)}
          style={styles.date}
        >
          <AppText variant="label">{formatAttendanceDate(date)}</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: nextDisabled }}
          disabled={nextDisabled}
          onPress={() => apply(shiftKey(date, 1))}
          style={[styles.arrow, nextDisabled && styles.disabled]}
        >
          <AppText variant="label" color={nextDisabled ? colors.disabledText : colors.text}>
            →
          </AppText>
        </Pressable>
      </View>
      {date !== today ? (
        <AppButton label="Today" variant="secondary" onPress={() => onChange(today)} />
      ) : null}
      {showPicker ? (
        <DateTimePicker
          value={pickerDateFromKey(date)}
          mode="date"
          maximumDate={pickerDateFromKey(today)}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            if (Platform.OS !== "ios") {
              setShowPicker(false);
            }
            if (event.type === "dismissed" || !selected) {
              return;
            }
            apply(keyFromPickerDate(selected));
          }}
        />
      ) : null}
      {showPicker && Platform.OS === "ios" ? (
        <AppButton label="Done" variant="secondary" onPress={() => setShowPicker(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
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
    paddingHorizontal: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
});
