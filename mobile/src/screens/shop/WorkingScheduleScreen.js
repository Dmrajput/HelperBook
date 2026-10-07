import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import { WEEKDAYS } from "../../constants/shop";
import { colors, spacing } from "../../theme";
import { formatTime } from "../../utils/shopFormat";

function timeToDate(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function dateToTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function TimeField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.timeField}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${formatTime(value)}`}
        onPress={() => setOpen(true)}
        style={styles.timeButton}
      >
        <AppText>{formatTime(value)}</AppText>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            if (Platform.OS !== "ios") {
              setOpen(false);
            }
            if (event.type === "dismissed" || !selected) {
              return;
            }
            onChange(dateToTime(selected));
          }}
        />
      ) : null}
      {open && Platform.OS === "ios" ? (
        <AppButton label="Done" variant="secondary" onPress={() => setOpen(false)} />
      ) : null}
    </View>
  );
}

export default function WorkingScheduleScreen({ form, onChange, errors }) {
  const weeklyOff = WEEKDAYS.filter((day) => !form.workingDays.includes(day.id)).map((day) => day.name);

  function toggleDay(dayId) {
    const selected = form.workingDays.includes(dayId)
      ? form.workingDays.filter((day) => day !== dayId)
      : [...form.workingDays, dayId];
    onChange({ workingDays: selected });
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="body" color={colors.textSecondary}>
        Which days is your shop open?
      </AppText>
      <View style={styles.days}>
        {WEEKDAYS.map((day) => {
          const selected = form.workingDays.includes(day.id);
          return (
            <Pressable
              key={day.id}
              accessibilityRole="checkbox"
              accessibilityLabel={day.name}
              accessibilityState={{ checked: selected }}
              onPress={() => toggleDay(day.id)}
              style={[styles.day, selected && styles.daySelected]}
            >
              <AppText variant="caption" align="center" color={selected ? colors.textInverse : colors.text}>
                {day.label}
              </AppText>
              <AppText variant="caption" align="center" color={selected ? colors.textInverse : colors.primary}>
                {selected ? "✓" : " "}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="body">Weekly off: {weeklyOff.length ? weeklyOff.join(", ") : "None"}</AppText>
      <FieldError message={errors.workingDays} />
      <TimeField label="Opening time" value={form.startTime} onChange={(startTime) => onChange({ startTime })} />
      <TimeField label="Closing time" value={form.endTime} onChange={(endTime) => onChange({ endTime })} />
      <FieldError message={errors.hours} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  days: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  day: {
    minWidth: 44,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeField: {
    gap: spacing.sm,
  },
  timeButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
