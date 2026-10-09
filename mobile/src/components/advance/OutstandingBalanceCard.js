import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

export default function OutstandingBalanceCard({ amount, label = "Outstanding" }) {
  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`${label} ${formatInr(amount)}`}>
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="heading">{formatInr(amount)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F3EEFF",
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
