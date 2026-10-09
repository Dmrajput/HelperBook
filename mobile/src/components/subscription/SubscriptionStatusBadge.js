import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const LABELS = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancels at period end",
  expired: "Expired",
};

export default function SubscriptionStatusBadge({ status }) {
  return (
    <View style={styles.badge}>
      <AppText variant="caption">{LABELS[status] || "Plan"}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
