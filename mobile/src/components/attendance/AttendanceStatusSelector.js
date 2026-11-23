import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { ATTENDANCE_STATUSES } from "../../constants/attendance";
import { colors, spacing } from "../../theme";

const TONES = {
  present: {
    background: colors.successBackground,
    border: colors.success,
    text: colors.success,
  },
  absent: {
    background: colors.errorBackground,
    border: colors.error,
    text: colors.error,
  },
  half_day: {
    background: colors.warningBackground,
    border: colors.warning,
    text: "#B45309",
  },
  leave: {
    background: colors.infoBackground,
    border: colors.info,
    text: colors.info,
  },
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
              {
                backgroundColor: selected ? tone.background : colors.surface,
                borderColor: selected ? tone.border : colors.border,
              },
              disabled && styles.disabled,
            ]}
          >
            <AppText
              variant="caption"
              align="center"
              numberOfLines={1}
              color={selected ? tone.text : colors.textSecondary}
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
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 14,
  },
  disabled: {
    opacity: 0.55,
  },
});
