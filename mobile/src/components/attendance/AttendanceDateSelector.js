import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { keyFromPickerDate, pickerDateFromKey, shiftKey, todayKey } from "../../utils/attendanceFormat";

function shortDateLabel(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function AttendanceDateSelector({ date, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const today = todayKey();
  const nextDisabled = shiftKey(date, 1) > today;
  const isToday = date === today;

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
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Attendance date, ${shortDateLabel(date)}`}
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [styles.date, pressed && styles.pressed]}
        >
          <AppText variant="label" numberOfLines={1} style={styles.dateLabel}>
            {shortDateLabel(date)}
          </AppText>
          {isToday ? (
            <View style={styles.todayChip}>
              <AppText variant="caption" color={colors.primary} style={styles.todayText}>
                Today
              </AppText>
            </View>
          ) : null}
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: nextDisabled }}
          disabled={nextDisabled}
          onPress={() => apply(shiftKey(date, 1))}
          style={({ pressed }) => [styles.arrow, nextDisabled && styles.disabled, pressed && !nextDisabled && styles.pressed]}
        >
          <Ionicons name="chevron-forward" size={18} color={nextDisabled ? colors.disabledText : colors.text} />
        </Pressable>
      </View>

      {!isToday ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Jump to today"
          onPress={() => onChange(today)}
          style={styles.jumpToday}
        >
          <AppText variant="caption" color={colors.primary} style={styles.todayText}>
            Jump to today
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
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.sm,
  },
  dateLabel: {
    flexShrink: 1,
    fontWeight: "700",
  },
  todayChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayText: {
    fontWeight: "700",
    fontSize: 11,
  },
  jumpToday: {
    alignSelf: "center",
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.88,
  },
});
