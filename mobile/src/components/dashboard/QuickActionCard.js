import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function QuickActionCard({
  title,
  description,
  icon,
  iconColor = colors.primary,
  iconBackground = colors.primaryLight,
  onPress,
  accessibilityLabel,
  disabled = false,
  compact = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.compact : styles.card,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={compact ? 20 : 22} color={iconColor} />
      </View>
      <AppText
        variant="label"
        numberOfLines={compact ? 1 : 2}
        style={styles.title}
        align={compact ? "center" : "left"}
      >
        {title}
      </AppText>
      {!compact && description ? (
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
          {description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 100,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  compact: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.45,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapCompact: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  title: {
    fontSize: 12,
    lineHeight: 15,
  },
});
