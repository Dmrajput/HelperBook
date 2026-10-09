import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { ATTENDANCE_STATUSES } from "../../constants/attendance";
import { spacing } from "../../theme";

const TONES = {
  present: { background: "#E8F8EF", selected: "#1C8A52" },
  absent: { background: "#FDECEC", selected: "#D4535E" },
  half_day: { background: "#FFF6E4", selected: "#C8881A" },
  leave: { background: "#EEF3FF", selected: "#4C6FE0" },
};

export default function AttendanceStatusSelector({ value, onChange, disabled = false }) {
  return (
    <View style={styles.row}>
      {ATTENDANCE_STATUSES.map((status) => {
        const selected = value === status.value;
        const tone = TONES[status.value];
        return (
          <Pressable
            key={status.value}
            accessibilityRole="button"
            accessibilityLabel={status.label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(status.value)}
            style={[
              styles.chip,
              { backgroundColor: selected ? tone.selected : tone.background },
              disabled && styles.disabled,
            ]}
          >
            <AppText
              variant="caption"
              align="center"
              numberOfLines={1}
              color={selected ? "#FFFFFF" : tone.selected}
              style={styles.label}
            >
              {status.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
});
