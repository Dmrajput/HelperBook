import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function ReportSummaryCard({ items }) {
  return (
    <View style={styles.card}>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <AppText variant="body" color={colors.textSecondary}>
            {item.label}
          </AppText>
          <AppText variant="subtitle">{item.value}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
});
