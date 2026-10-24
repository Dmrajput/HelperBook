import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function BillingIntervalToggle({ value, onChange, maxSavePercent = 0 }) {
  return (
    <View style={styles.wrap}>
      {maxSavePercent > 0 ? (
        <View style={styles.saveBadge}>
          <AppText variant="caption" color="#FFFFFF" style={styles.saveText}>
            {`Save up to ${maxSavePercent}%`}
          </AppText>
        </View>
      ) : null}
      <View style={styles.track}>
        {[
          { id: "monthly", label: "Monthly" },
          { id: "yearly", label: "Yearly" },
        ].map((option) => {
          const active = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.id)}
              style={[styles.option, active && styles.optionActive]}
            >
              <AppText variant="label" color={active ? colors.textInverse : colors.textSecondary} align="center">
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs, position: "relative" },
  track: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  option: {
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  saveBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: "absolute",
    right: 10,
    top: -10,
    zIndex: 2,
  },
  saveText: { fontSize: 10, fontWeight: "700" },
});
