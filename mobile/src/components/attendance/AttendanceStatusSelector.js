import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { ATTENDANCE_STATUSES } from "../../constants/attendance";
import { colors, spacing } from "../../theme";

export default function AttendanceStatusSelector({ value, onChange, disabled = false }) {
  return (
    <View style={styles.row}>
      {ATTENDANCE_STATUSES.map((status) => {
        const selected = value === status.value;
        return (
          <Pressable
            key={status.value}
            accessibilityRole="button"
            accessibilityLabel={status.label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(status.value)}
            style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
          >
            <AppText variant="caption" color={selected ? colors.textInverse : colors.text}>
              {status.label}
            </AppText>
            {selected ? (
              <AppText variant="caption" color={colors.textInverse}>
                Selected
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    minWidth: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
