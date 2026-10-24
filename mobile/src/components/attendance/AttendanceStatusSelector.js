import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { ATTENDANCE_STATUSES } from "../../constants/attendance";
import { colors, spacing } from "../../theme";

const TONES = {
  present: {
    background: colors.successBackground,
    border: colors.success,
    text: colors.success,
    idleBackground: "#F8FAFC",
  },
  absent: {
    background: colors.errorBackground,
    border: colors.error,
    text: colors.error,
    idleBackground: "#F8FAFC",
  },
  half_day: {
    background: colors.warningBackground,
    border: colors.warning,
    text: "#B45309",
    idleBackground: "#F8FAFC",
  },
  leave: {
    background: colors.infoBackground,
    border: colors.info,
    text: colors.info,
    idleBackground: "#F8FAFC",
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
                backgroundColor: selected ? tone.background : tone.idleBackground,
                borderColor: selected ? tone.border : colors.border,
              },
              disabled && styles.disabled,
            ]}
          >
            {selected ? (
              <Ionicons name="checkmark" size={12} color={tone.text} style={styles.check} />
            ) : null}
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
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    gap: 2,
  },
  check: {
    marginRight: 1,
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
