import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function ReportRow({ title, meta, value, onPress, accessibilityLabel }) {
  const body = (
    <View style={styles.card}>
      <View style={styles.text}>
        <AppText variant="subtitle">{title}</AppText>
        {meta ? (
          <AppText variant="body" color={colors.textSecondary}>
            {meta}
          </AppText>
        ) : null}
      </View>
      {value ? <AppText variant="subtitle">{value}</AppText> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} onPress={onPress}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  text: { flex: 1, gap: spacing.xs },
});
