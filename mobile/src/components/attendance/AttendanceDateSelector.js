import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
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
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Attendance date, ${formatAttendanceDate(date)}`}
          onPress={() => setShowPicker(true)}
          style={styles.date}
        >
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <AppText variant="label" numberOfLines={1} style={styles.dateLabel}>
            {formatAttendanceDate(date)}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: nextDisabled }}
          disabled={nextDisabled}
          onPress={() => apply(shiftKey(date, 1))}
          style={[styles.arrow, nextDisabled && styles.disabled]}
        >
          <Ionicons name="chevron-forward" size={18} color={nextDisabled ? colors.disabledText : colors.primary} />
        </Pressable>
      </View>
      {date !== today ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Jump to today" onPress={() => onChange(today)} style={styles.today}>
          <AppText variant="label" color={colors.primary}>
            Today
          </AppText>
        </Pressable>
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xs,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  dateLabel: {
    flexShrink: 1,
  },
  today: {
    alignSelf: "center",
    minHeight: 32,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.45,
  },
});
