import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import BillingIntervalToggle from "../../components/subscription/BillingIntervalToggle";
import CurrentPlanCard from "../../components/subscription/CurrentPlanCard";
import PlanCard from "../../components/subscription/PlanCard";
import PlanComparison from "../../components/subscription/PlanComparison";
import PlanFeaturesRow from "../../components/subscription/PlanFeaturesRow";
import RazorpayCheckout from "../../components/subscription/RazorpayCheckout";
import TrialBanner from "../../components/subscription/TrialBanner";
import useSubscription from "../../hooks/useSubscription";
import { cancelSubscription, changePlan, resumeSubscription, verifyPayment } from "../../services/subscriptionService";
import { colors, spacing } from "../../theme";
import {
  effectivePrice,
  formatInr,
  hasDiscount,
  listPrice,
  maxYearlySavePercent,
  sortPlans,
} from "../../components/subscription/planMeta";

function requestId() {
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { subscription, plans, loading, error, refreshSubscription } = useSubscription();
  const [interval, setInterval] = useState("monthly");
  const [busy, setBusy] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [paymentState, setPaymentState] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const orderedPlans = useMemo(() => sortPlans(plans), [plans]);
  const yearlyAvailable = plans.some((plan) => plan.yearlyAvailable);
  const maxSave = maxYearlySavePercent(plans);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshSubscription();
    } catch (refreshError) {
      Alert.alert("Subscription", refreshError.message || "Unable to refresh subscription.");
    } finally {
      setRefreshing(false);
    }
  }

  async function runChange(plan) {
    if (busy) return;
    setBusy(plan.id);
    setPaymentState("Preparing payment");
    try {
      const result = await changePlan({
        planId: plan.id,
        billingInterval: plan.id === "free" ? "monthly" : interval,
        requestId: requestId(),
      });
      if (result.change === "scheduled") {
        setPaymentState("");
        Alert.alert(result.blocked ? "Downgrade waiting" : "Downgrade scheduled", result.message);
        await refreshSubscription();
        return;
      }
      if (result.checkout) {
        setPaymentState("Opening Razorpay");
        setCheckout(result.checkout);
        return;
      }
      setPaymentState("");
      await refreshSubscription();
    } catch (changeError) {
      setPaymentState("");
      Alert.alert("Subscription", changeError.message || "Unable to change the plan.");
    } finally {
      setBusy("");
    }
  }

  function confirmPlan(plan) {
    if (!subscription || busy) return;
    const current =
      !subscription.isTrial &&
      subscription.status !== "expired" &&
      subscription.plan.id === plan.id &&
      (plan.id === "free" || subscription.billingInterval === interval);
    if (current) return;

    if (interval === "yearly" && plan.id !== "free" && !plan.yearlyAvailable) {
      Alert.alert("Yearly billing", "Yearly billing is not available for this plan yet. Choose monthly, or ask support.");
      return;
    }

    const movingDown =
      plan.employeeLimit < subscription.plan.employeeLimit && !subscription.isTrial && subscription.status !== "expired";
    if (movingDown) {
      const extra = Math.max(0, subscription.activeEmployeeCount - plan.employeeLimit);
      Alert.alert(
        `Downgrade to ${plan.name}`,
        extra > 0
          ? `${plan.name} allows ${plan.employeeLimit} active employees.\n\nYou currently have ${subscription.activeEmployeeCount} active employees.\n\nYou need to deactivate ${extra} employees before ${plan.name} can become active.\n\nYour existing employee data will not be deleted.`
          : `Downgrade will take effect at the end of your current billing period.\n\n${plan.name} allows ${plan.employeeLimit} active employees.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Schedule downgrade", onPress: () => runChange(plan) },
        ]
      );
      return;
    }

    if (plan.id === "free") {
      runChange(plan);
      return;
    }

    const amount = effectivePrice(plan, interval);
    const listed = listPrice(plan, interval);
    const billingLabel = interval === "yearly" ? "year" : "month";
    const priceLine =
      amount === null
        ? "Yearly billing is not available yet."
        : hasDiscount(plan, interval) && listed != null
          ? `Regular price ${formatInr(listed)} / ${billingLabel}\nDiscounted price ${formatInr(amount)} / ${billingLabel}`
          : `Price ${formatInr(amount)} / ${billingLabel}`;

    Alert.alert(
      `Upgrade to ${plan.name}?`,
      `${plan.name} allows up to ${plan.employeeLimit} active employees.\n\nYour current plan:\n${subscription.plan.name} — ${subscription.plan.employeeLimit} employees\n\nNew plan:\n${plan.name} — ${plan.employeeLimit} employees\n\n${priceLine}\n\nContinue to payment?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: amount === null ? "Unavailable" : `Pay ${formatInr(amount)}`, onPress: () => runChange(plan) },
      ]
    );
  }

  async function onPaymentResult(payload) {
    setCheckout(null);
    setPaymentState("Verifying payment");
    try {
      await verifyPayment(payload);
      setPaymentState("Payment successful");
      await refreshSubscription();
      Alert.alert("Payment Successful", "Your plan is now active.");
    } catch (verifyError) {
      setPaymentState("Payment failed");
      Alert.alert("Payment failed", verifyError.message || "Your subscription was not changed. Please try again.");
    }
  }

  async function cancelPlan() {
    if (busy) return;
    setBusy("cancel");
    try {
      await cancelSubscription();
      await refreshSubscription();
      Alert.alert("Subscription", "Your plan stays active until the end of the current billing period.");
    } catch (cancelError) {
      Alert.alert("Subscription", cancelError.message || "Unable to cancel the subscription.");
    } finally {
      setBusy("");
    }
  }

  async function resumePlan() {
    if (busy) return;
    setBusy("resume");
    try {
      await resumeSubscription();
      await refreshSubscription();
    } catch (resumeError) {
      Alert.alert("Subscription", resumeError.message || "Unable to resume the subscription.");
    } finally {
      setBusy("");
    }
  }

  function actionLabel(plan, current) {
    if (busy === plan.id) return "Please wait...";
    if (current) return "Current Plan";
    if (plan.id === "free") return "Get Started";
    if (
      plan.employeeLimit < (subscription?.plan.employeeLimit || 0) &&
      !subscription?.isTrial &&
      subscription?.status !== "expired"
    ) {
      return `Downgrade to ${plan.name}`;
    }
    return `Choose ${plan.name}`;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Subscription
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Plan and billing
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Payment history"
            onPress={() => navigation.navigate("PaymentHistory")}
            style={styles.headerAction}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading && !subscription ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? (
            <ErrorView
              title="Unable to verify your subscription."
              message="Please check your internet connection and try again."
              onRetry={refreshSubscription}
            />
          ) : null}

          {paymentState ? (
            <View style={styles.paymentState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <AppText variant="caption" color={colors.primary}>
                {paymentState}
              </AppText>
            </View>
          ) : null}

          {subscription?.status === "expired" ? (
            <View style={styles.notice}>
              <Ionicons name="alert-circle-outline" size={18} color="#9A5B12" />
              <View style={styles.noticeCopy}>
                <AppText variant="label" style={styles.noticeTitle}>
                  Subscription expired
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  You're currently on the Free plan.
                </AppText>
              </View>
            </View>
          ) : null}

          <TrialBanner subscription={subscription} />
          <CurrentPlanCard
            subscription={subscription}
            busy={busy}
            onCancel={cancelPlan}
            onResume={resumePlan}
          />

          <View style={styles.sectionHeader}>
            <AppText variant="label" style={styles.sectionTitle}>
              Choose a plan
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {orderedPlans.length ? `${orderedPlans.length} plans` : "Loading"}
            </AppText>
          </View>

          <BillingIntervalToggle
            value={interval}
            onChange={setInterval}
            maxSavePercent={yearlyAvailable ? maxSave : 0}
          />
          {!yearlyAvailable ? (
            <AppText variant="caption" color={colors.textSecondary}>
              Yearly billing can be enabled from admin plan pricing. Monthly plans are available now.
            </AppText>
          ) : null}

          {orderedPlans.map((plan) => {
            const current =
              subscription &&
              !subscription.isTrial &&
              subscription.status !== "expired" &&
              subscription.plan.id === plan.id &&
              (plan.id === "free" || subscription.billingInterval === interval);
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                interval={interval}
                current={current}
                actionLabel={actionLabel(plan, current)}
                disabled={Boolean(busy) || current}
                onPress={() => confirmPlan(plan)}
              />
            );
          })}

          <PlanFeaturesRow />
          <PlanComparison plans={orderedPlans} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Payment history"
            onPress={() => navigation.navigate("PaymentHistory")}
            style={({ pressed }) => [styles.footerSecondary, pressed && styles.pressed]}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <AppText variant="label" color={colors.primary}>
              Payment history
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Subscription history"
            onPress={() => navigation.navigate("SubscriptionHistory")}
            style={({ pressed }) => [styles.footerSecondary, pressed && styles.pressed]}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <AppText variant="label" color={colors.primary}>
              Subscription history
            </AppText>
          </Pressable>
        </View>
      </View>

      <RazorpayCheckout
        checkout={checkout}
        onResult={onPaymentResult}
        onClose={() => {
          setCheckout(null);
          setPaymentState("Payment failed");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  paymentState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.warningBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: spacing.md,
  },
  noticeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  noticeTitle: {
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerSecondary: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
});
