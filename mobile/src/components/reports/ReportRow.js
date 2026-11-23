import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function ReportRow({ title, meta, value, onPress, accessibilityLabel }) {
  const body = (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="document-text-outline" size={16} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <AppText variant="label" style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        {meta ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {meta}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="label" style={styles.value} numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.placeholder} /> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontWeight: "700",
  },
  value: {
    fontWeight: "800",
    maxWidth: 96,
  },
});
