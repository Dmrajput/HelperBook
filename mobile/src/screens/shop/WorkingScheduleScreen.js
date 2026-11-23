import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
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
      <AppText variant="label" style={styles.fieldLabel}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${formatTime(value)}`}
        onPress={() => setOpen(true)}
        style={styles.timeButton}
      >
        <View style={styles.timeIcon}>
          <Ionicons name="time-outline" size={16} color={colors.info} />
        </View>
        <AppText variant="body" style={styles.timeValue}>
          {formatTime(value)}
        </AppText>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={() => setOpen(false)}
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
        >
          <AppText variant="label" color={colors.primary}>
            Done
          </AppText>
        </Pressable>
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
              <AppText
                variant="caption"
                align="center"
                color={selected ? colors.primary : colors.text}
                style={styles.dayLabel}
              >
                {day.label}
              </AppText>
              <Ionicons
                name={selected ? "checkmark" : "ellipse-outline"}
                size={14}
                color={selected ? colors.primary : colors.border}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.offCard}>
        <Ionicons name="moon-outline" size={16} color={colors.textSecondary} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.offText}>
          Weekly off: {weeklyOff.length ? weeklyOff.join(", ") : "None"}
        </AppText>
      </View>
      <FieldError message={errors.workingDays} />

      <TimeField label="Opening time" value={form.startTime} onChange={(startTime) => onChange({ startTime })} />
      <TimeField label="Closing time" value={form.endTime} onChange={(endTime) => onChange({ endTime })} />
      <FieldError message={errors.hours} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  days: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  day: {
    minWidth: 48,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  daySelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dayLabel: {
    fontWeight: "700",
  },
  offCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  offText: {
    flex: 1,
  },
  timeField: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontWeight: "700",
  },
  timeButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  timeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.infoBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  timeValue: {
    flex: 1,
    fontWeight: "600",
  },
  doneButton: {
    alignSelf: "flex-end",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.88,
  },
});
