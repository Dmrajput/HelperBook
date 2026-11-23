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
        <Ionicons name={icon} size={compact ? 22 : 22} color={iconColor} />
      </View>
      <AppText
        variant="label"
        numberOfLines={compact ? 2 : 2}
        style={[styles.title, compact && styles.titleCompact]}
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
    gap: 8,
    minHeight: 96,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
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
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  title: {
    fontSize: 12,
    lineHeight: 15,
  },
  titleCompact: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
  },
});
