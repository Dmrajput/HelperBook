import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
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
  const { subscription, plans, loading, error, refreshSubscription } = useSubscription();
  const [interval, setInterval] = useState("monthly");
  const [busy, setBusy] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [paymentState, setPaymentState] = useState("");

  const orderedPlans = useMemo(() => sortPlans(plans), [plans]);
  const yearlyAvailable = plans.some((plan) => plan.yearlyAvailable);
  const maxSave = maxYearlySavePercent(plans);

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
    <AppScreen title="Subscription" subtitle="Plan and billing" icon="ribbon">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? (
          <ErrorView
            title="Unable to verify your subscription."
            message="Please check your internet connection and try again."
            onRetry={refreshSubscription}
          />
        ) : null}
        {paymentState ? <AppText variant="body">{paymentState}</AppText> : null}
        {subscription?.status === "expired" ? (
          <View style={styles.notice}>
            <AppText variant="body">Your subscription has expired.</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              You're currently on the Free plan.
            </AppText>
          </View>
        ) : null}

        <TrialBanner subscription={subscription} />
        <CurrentPlanCard
          subscription={subscription}
          busy={busy}
          onCancel={cancelPlan}
          onResume={resumePlan}
        />

        <AppText variant="subtitle">Choose a plan</AppText>
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

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("PaymentHistory")}
          style={({ pressed }) => [styles.historyBtn, pressed && styles.pressed]}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            Payment History
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("SubscriptionHistory")}
          style={({ pressed }) => [styles.historyBtn, pressed && styles.pressed]}
        >
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            Subscription History
          </AppText>
        </Pressable>
      </ScrollView>
      <RazorpayCheckout
        checkout={checkout}
        onResult={onPaymentResult}
        onClose={() => {
          setCheckout(null);
          setPaymentState("Payment failed");
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.lg },
  notice: {
    backgroundColor: colors.warningBackground,
    borderRadius: 14,
    gap: spacing.xs,
    padding: spacing.md,
  },
  historyBtn: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.88 },
});
