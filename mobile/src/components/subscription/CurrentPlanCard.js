import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import SubscriptionStatusBadge from "./SubscriptionStatusBadge";

function priceLine(subscription) {
  if (!subscription?.plan || subscription.plan.id === "free" || subscription.isTrial) return "₹0";
  if (!subscription.billingInterval) return "₹0";
  const price = subscription.billingInterval === "yearly" ? subscription.plan.yearlyPrice : subscription.plan.monthlyPrice;
  if (price === null || price === undefined) return "";
  const interval = subscription.billingInterval === "yearly" ? "year" : "month";
  return `₹${price}/${interval}`;
}

export default function CurrentPlanCard({ subscription }) {
  if (!subscription) return null;
  const slots = subscription.remainingEmployeeSlots;
  const slotLine = subscription.overLimit
    ? `You have ${subscription.activeEmployeeCount} active employees. This plan allows ${subscription.plan.employeeLimit}. You can view and deactivate employees. New employees stay blocked until you upgrade or deactivate some.`
    : slots === 1
      ? "1 employee slot remaining"
      : `${slots} employee slots remaining`;
  return (
    <View style={styles.card}>
      <AppText variant="label" color={colors.textSecondary}>
        Your Plan
      </AppText>
      <View style={styles.row}>
        <AppText variant="heading">{subscription.isTrial ? `${subscription.plan.name} Trial` : subscription.plan.name}</AppText>
        <SubscriptionStatusBadge status={subscription.status} />
      </View>
      <AppText variant="body">{priceLine(subscription)}</AppText>
      <AppText variant="body">
        {subscription.activeEmployeeCount} / {subscription.plan.employeeLimit} employees
      </AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {slotLine}
      </AppText>
      {subscription.daysUntilExpiry === 0 ? (
        <AppText variant="body">Your plan expires today.</AppText>
      ) : null}
      {subscription.daysUntilExpiry > 0 && subscription.daysUntilExpiry <= 7 ? (
        <AppText variant="body">Your plan expires in {subscription.daysUntilExpiry} days.</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
});
