import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr, PLAN_META } from "./planMeta";

function priceLine(subscription) {
  if (!subscription?.plan || subscription.plan.id === "free" || subscription.isTrial) {
    return `${formatInr(0)} / month`;
  }
  const interval = subscription.billingInterval === "yearly" ? "year" : "month";
  const price =
    subscription.billingInterval === "yearly" ? subscription.plan.yearlyPrice : subscription.plan.monthlyPrice;
  if (price === null || price === undefined) return "";
  return `${formatInr(price)} / ${interval}`;
}

export default function CurrentPlanCard({ subscription, onCancel, onResume, busy }) {
  if (!subscription) return null;

  const meta = PLAN_META[subscription.plan?.id] || PLAN_META.starter;
  const slots = subscription.remainingEmployeeSlots;
  const slotLine = subscription.overLimit
    ? `Over limit · ${subscription.activeEmployeeCount} active / ${subscription.plan.employeeLimit} allowed`
    : slots === 1
      ? "1 employee slot remaining"
      : `${slots} employee slots remaining`;
  const statusLabel = subscription.isTrial
    ? "Trial"
    : subscription.cancelAtPeriodEnd
      ? "Cancelling"
      : subscription.status === "expired"
        ? "Expired"
        : "Active";
  const statusTone =
    subscription.status === "expired" || subscription.cancelAtPeriodEnd
      ? { bg: colors.warningBackground, fg: "#9A5B12" }
      : { bg: colors.successBackground, fg: colors.success };

  const showCancel = subscription?.source === "razorpay" && subscription?.status === "active" && !subscription.cancelAtPeriodEnd;
  const showResume = Boolean(subscription?.cancelAtPeriodEnd);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, { backgroundColor: meta.accentSoft }]}>
            <Ionicons name={meta.icon} size={18} color={meta.accent} />
          </View>
          <View style={styles.titleText}>
            <AppText variant="caption" color={colors.textSecondary}>
              Current Plan
            </AppText>
            <View style={styles.nameRow}>
              <AppText variant="heading">
                {subscription.isTrial ? `${subscription.plan.name} Trial` : subscription.plan.name}
              </AppText>
              <View style={[styles.status, { backgroundColor: statusTone.bg }]}>
                <AppText variant="caption" color={statusTone.fg} style={styles.statusText}>
                  {statusLabel}
                </AppText>
              </View>
            </View>
          </View>
        </View>
        {showCancel ? (
          <Pressable
            accessibilityRole="button"
            disabled={Boolean(busy)}
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
          >
            <AppText variant="caption" color={colors.primary}>
              {busy === "cancel" ? "Cancelling..." : "Cancel at period end"}
            </AppText>
          </Pressable>
        ) : null}
        {showResume ? (
          <Pressable
            accessibilityRole="button"
            disabled={Boolean(busy)}
            onPress={onResume}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
          >
            <AppText variant="caption" color={colors.primary}>
              {busy === "resume" ? "Resuming..." : "Resume plan"}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <AppText variant="subtitle">{priceLine(subscription)}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {subscription.activeEmployeeCount} / {subscription.plan.employeeLimit} employees
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {slotLine}
      </AppText>
      {subscription.daysUntilExpiry === 0 ? (
        <AppText variant="caption" color={colors.warning}>
          Your plan expires today.
        </AppText>
      ) : null}
      {subscription.daysUntilExpiry > 0 && subscription.daysUntilExpiry <= 7 ? (
        <AppText variant="caption" color={colors.warning}>
          Your plan expires in {subscription.daysUntilExpiry} days.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  top: { gap: spacing.sm },
  titleRow: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  iconWrap: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  titleText: { flex: 1, gap: 2 },
  nameRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontWeight: "700" },
  cancelBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.85 },
});
