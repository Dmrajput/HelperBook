import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { ATTENDANCE_STATUSES } from "../../constants/attendance";
import { colors, spacing } from "../../theme";

const TONES = {
  present: { background: colors.successBackground, selected: colors.success },
  absent: { background: colors.errorBackground, selected: colors.error },
  half_day: { background: colors.warningBackground, selected: colors.warning },
  leave: { background: colors.infoBackground, selected: colors.info },
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
