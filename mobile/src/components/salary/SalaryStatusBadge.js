import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const LABELS = {
  draft: "Draft",
  finalized: "Finalized",
  paid: "Paid",
};

export default function SalaryStatusBadge({ status }) {
  const label = LABELS[status] || "Not calculated";
  const finalized = status === "finalized" || status === "paid";

  return (
    <View
      style={[styles.badge, finalized ? styles.finalized : styles.draft]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <AppText variant="caption" color={finalized ? colors.success : colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  draft: {
    backgroundColor: colors.disabled,
  },
  finalized: {
    backgroundColor: colors.successBackground,
  },
});
