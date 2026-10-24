import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import {
  discountPercent,
  effectivePrice,
  formatInr,
  hasDiscount,
  listPrice,
  PLAN_FEATURES,
  PLAN_META,
  yearlyMonthlyEquivalent,
  yearlyVsMonthlySavePercent,
} from "./planMeta";

export default function PlanCard({
  plan,
  interval,
  actionLabel,
  onPress,
  disabled,
  current,
}) {
  const meta = PLAN_META[plan.id] || PLAN_META.starter;
  const amount = effectivePrice(plan, interval);
  const listed = listPrice(plan, interval);
  const showDiscount = hasDiscount(plan, interval);
  const percent = discountPercent(plan, interval);
  const yearlySave = yearlyVsMonthlySavePercent(plan);
  const yearlyEquiv = yearlyMonthlyEquivalent(plan);
  const yearlyUnavailable = interval === "yearly" && plan.id !== "free" && !plan.yearlyAvailable;

  const primaryLabel =
    plan.id === "free"
      ? `${formatInr(0)} / month`
      : yearlyUnavailable
        ? "Yearly coming soon"
        : interval === "yearly"
          ? `${formatInr(amount)} / year`
          : `${formatInr(amount)} / month`;

  const strikeLabel =
    showDiscount && listed != null && !yearlyUnavailable
      ? interval === "yearly"
        ? `${formatInr(listed)} / year`
        : `${formatInr(listed)} / month`
      : null;

  return (
    <View style={[styles.card, current && styles.current, { borderLeftColor: meta.accent }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={[styles.iconWrap, { backgroundColor: meta.accentSoft }]}>
            <Ionicons name={meta.icon} size={18} color={meta.accent} />
          </View>
          <AppText variant="subtitle">{plan.name}</AppText>
        </View>
        {current ? (
          <View style={styles.currentBadge}>
            <AppText variant="caption" color={colors.primary} style={styles.badgeText}>
              Current Plan
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.priceBlock}>
        {strikeLabel ? (
          <AppText variant="body" color={colors.textSecondary} style={styles.strike}>
            {strikeLabel}
          </AppText>
        ) : null}
        <View style={styles.priceRow}>
          <AppText variant="heading">{primaryLabel}</AppText>
          {percent ? (
            <View style={styles.saveBadge}>
              <AppText variant="caption" color={colors.success} style={styles.badgeText}>
                {`Save ${percent}%`}
              </AppText>
            </View>
          ) : null}
        </View>

        {interval === "monthly" && plan.yearlyAvailable && plan.yearlyPrice != null ? (
          <View style={styles.priceRow}>
            <AppText variant="body" color={colors.textSecondary}>
              {`${formatInr(plan.yearlyPrice)} / year`}
            </AppText>
            {yearlySave ? (
              <View style={styles.saveBadge}>
                <AppText variant="caption" color={colors.success} style={styles.badgeText}>
                  {`Save ${yearlySave}%`}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <AppText variant="body" color={colors.textSecondary}>
        Up to {plan.employeeLimit} {plan.employeeLimit === 1 ? "employee" : "employees"}
      </AppText>

      <View style={styles.features}>
        {PLAN_FEATURES.map((item) => (
          <View key={item} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <AppText variant="body" color={colors.textSecondary}>
              {item}
            </AppText>
          </View>
        ))}
      </View>

      <AppButton
        label={actionLabel}
        onPress={onPress}
        disabled={disabled || yearlyUnavailable}
        variant={current || plan.id === "free" ? "secondary" : "primary"}
      />

      {interval === "monthly" && plan.yearlyAvailable && yearlyEquiv != null ? (
        <AppText variant="caption" color={colors.textSecondary} align="center">
          {`Only ${formatInr(yearlyEquiv)}/month with yearly plan`}
        </AppText>
      ) : null}
      {interval === "yearly" && plan.yearlyAvailable && yearlyEquiv != null ? (
        <AppText variant="caption" color={colors.textSecondary} align="center">
          {`About ${formatInr(yearlyEquiv)}/month billed yearly`}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  current: {
    backgroundColor: "#F8F7FF",
    borderColor: colors.primary,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  titleBlock: { alignItems: "center", flexDirection: "row", flex: 1, gap: spacing.sm },
  iconWrap: {
    alignItems: "center",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  currentBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceBlock: { gap: 4 },
  priceRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  strike: { textDecorationLine: "line-through" },
  saveBadge: {
    backgroundColor: colors.successBackground,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontWeight: "700" },
  features: { gap: 6 },
  featureRow: { alignItems: "center", flexDirection: "row", gap: 8 },
});
