import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { statusLabel } from "../../utils/attendanceFormat";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function mondayOffset(year, month) {
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (weekday + 6) % 7;
}

export default function AttendanceCalendar({ year, month, days, today, onSelectDate }) {
  const byDate = new Map((days || []).map((day) => [day.date, day]));
  const count = daysInMonth(year, month);
  const offset = mondayOffset(year, month);
  const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];

  return (
    <View style={styles.wrap}>
      <View style={styles.week}>
        {WEEKDAYS.map((day) => (
          <AppText key={day} variant="caption" color={colors.textSecondary} style={styles.weekday}>
            {day}
          </AppText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }
          const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const info = byDate.get(key);
          const future = key > today;
          const label = info?.status
            ? statusLabel(info.status)
            : info
              ? `Present ${info.present}, Absent ${info.absent}, Half Day ${info.halfDay}, Leave ${info.leave}`
              : "No attendance";
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${day}, ${label}`}
              accessibilityState={{ disabled: future }}
              disabled={future}
              onPress={() => onSelectDate(key)}
              style={[styles.cell, key === today && styles.today, future && styles.future]}
            >
              <AppText variant="caption">{day}</AppText>
              {info?.status ? (
                <AppText variant="caption" numberOfLines={1}>
                  {statusLabel(info.status)}
                </AppText>
              ) : info ? (
                <AppText variant="caption" numberOfLines={2}>
                  {info.present}P {info.absent}A
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  week: {
    flexDirection: "row",
  },
  weekday: {
    width: "14.28%",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  today: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  future: {
    opacity: 0.35,
  },
});
