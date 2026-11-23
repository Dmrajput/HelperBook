import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

export default function OutstandingBalanceCard({ amount, label = "Outstanding", staffCount }) {
  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${label} ${formatInr(amount)}`}
    >
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="book-outline" size={18} color={colors.secondary} />
        </View>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.textSecondary}>
            {label}
          </AppText>
          <AppText style={styles.amount} numberOfLines={1}>
            {formatInr(amount)}
          </AppText>
        </View>
        {staffCount != null ? (
          <View style={styles.chip}>
            <AppText variant="caption" color={colors.secondary} style={styles.chipText}>
              {`${staffCount} staff`}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  amount: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  chip: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontWeight: "700",
  },
});
