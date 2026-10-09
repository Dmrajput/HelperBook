import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import CurrentPlanCard from "../../components/subscription/CurrentPlanCard";
import PlanCard from "../../components/subscription/PlanCard";
import PlanComparison from "../../components/subscription/PlanComparison";
import RazorpayCheckout from "../../components/subscription/RazorpayCheckout";
import TrialBanner from "../../components/subscription/TrialBanner";
import useSubscription from "../../hooks/useSubscription";
import { cancelSubscription, changePlan, resumeSubscription, verifyPayment } from "../../services/subscriptionService";
import { colors, spacing } from "../../theme";

function priceLabel(plan, interval) {
  if (plan.id === "free") return "₹0";
  if (interval === "yearly") {
    return plan.yearlyPrice === null ? "Yearly plan coming soon" : `₹${plan.yearlyPrice} / year`;
  }
  return `₹${plan.monthlyPrice} / month`;
}

function requestId() {
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export default function SubscriptionScreen({ navigation }) {
  const { subscription, plans, loading, error, refreshSubscription } = useSubscription();
  const [interval, setInterval] = useState("monthly");
  const [busy, setBusy] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [paymentState, setPaymentState] = useState("");
  const yearlyAvailable = plans.some((plan) => plan.yearlyAvailable);

  async function runChange(plan) {
    if (busy) return;
    setBusy(plan.id);
    setPaymentState("Preparing payment");
    try {
      const result = await changePlan({ planId: plan.id, billingInterval: plan.id === "free" ? "monthly" : interval, requestId: requestId() });
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
    const current = !subscription.isTrial && subscription.plan.id === plan.id && (plan.id === "free" || subscription.billingInterval === interval);
    if (current) return;
    const movingDown = plan.employeeLimit < subscription.plan.employeeLimit && !subscription.isTrial && subscription.status !== "expired";
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
    const amount = interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    Alert.alert(
      `Upgrade to ${plan.name}?`,
      `${plan.name} allows up to ${plan.employeeLimit} active employees.\n\nYour current plan:\n${subscription.plan.name} — ${subscription.plan.employeeLimit} employees\n\nNew plan:\n${plan.name} — ${plan.employeeLimit} employees\n\nContinue to payment?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: amount === null ? "Unavailable" : `Pay ₹${amount}`, onPress: () => runChange(plan) },
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

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="heading" accessibilityRole="header">Subscription</AppText>
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
            <AppText variant="body">You're currently on the Free plan.</AppText>
          </View>
        ) : null}
        <TrialBanner subscription={subscription} />
        <CurrentPlanCard subscription={subscription} />
        {subscription?.cancelAtPeriodEnd ? (
          <AppButton label={busy === "resume" ? "Resuming..." : "Resume plan"} onPress={resumePlan} disabled={Boolean(busy)} />
        ) : null}
        {subscription?.source === "razorpay" && subscription?.status === "active" ? (
          <AppButton label={busy === "cancel" ? "Cancelling..." : "Cancel at period end"} variant="secondary" onPress={cancelPlan} disabled={Boolean(busy)} />
        ) : null}
        <AppText variant="subtitle">Choose a plan</AppText>
        {yearlyAvailable ? (
          <View style={styles.row}>
            <AppButton label="Monthly" variant={interval === "monthly" ? "primary" : "secondary"} onPress={() => setInterval("monthly")} />
            <AppButton label="Yearly" variant={interval === "yearly" ? "primary" : "secondary"} onPress={() => setInterval("yearly")} />
          </View>
        ) : (
          <AppText variant="body" color={colors.textSecondary}>Yearly plan coming soon</AppText>
        )}
        {plans.map((plan) => {
          const current = subscription && !subscription.isTrial && subscription.status !== "expired" && subscription.plan.id === plan.id && (plan.id === "free" || subscription.billingInterval === interval);
          const label = current ? "Current plan" : plan.employeeLimit < (subscription?.plan.employeeLimit || 0) && !subscription?.isTrial && subscription?.status !== "expired" ? `Downgrade to ${plan.name}` : `Choose ${plan.name}`;
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              current={current}
              priceLabel={priceLabel(plan, interval)}
              actionLabel={busy === plan.id ? "Please wait..." : label}
              disabled={Boolean(busy) || current || (interval === "yearly" && !plan.yearlyAvailable && plan.id !== "free")}
              onPress={() => confirmPlan(plan)}
            />
          );
        })}
        <PlanComparison plans={plans} />
        <AppButton label="Payment History" variant="secondary" onPress={() => navigation.navigate("PaymentHistory")} />
        <AppButton label="Subscription History" variant="secondary" onPress={() => navigation.navigate("SubscriptionHistory")} />
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
      <RazorpayCheckout checkout={checkout} onResult={onPaymentResult} onClose={() => { setCheckout(null); setPaymentState("Payment failed"); }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.lg },
  notice: { gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
});
