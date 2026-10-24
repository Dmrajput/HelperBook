import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function SectionHeader({ title, actionLabel, onAction, accessibilityLabel, sideLabel }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || actionLabel}
          onPress={onAction}
          hitSlop={8}
          style={styles.action}
        >
          <AppText variant="caption" color={colors.primary} style={styles.link}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : sideLabel ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {sideLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 24,
  },
  title: {
    fontWeight: "700",
    flex: 1,
    fontSize: 15,
  },
  action: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  link: {
    fontWeight: "700",
  },
});
