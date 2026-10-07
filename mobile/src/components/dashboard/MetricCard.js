import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function MetricCard({ title, value, subtitle, onPress, disabled = false, compact = false }) {
  const content = (
    <View style={styles.card}>
      <AppText variant="label" color={colors.textSecondary}>
        {title}
      </AppText>
      <AppText variant={compact ? "heading" : "title"}>{value}</AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress || disabled) {
    return <View style={styles.fill}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${value}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.fill, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
});
