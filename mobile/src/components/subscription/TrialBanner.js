import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function TrialBanner({ subscription }) {
  if (!subscription?.isTrial) return null;
  const days = subscription.trialDaysRemaining;
  const dayLine = days === 1 ? "Your trial ends tomorrow." : `${days} days remaining.`;
  return (
    <View style={styles.banner}>
      <AppText variant="subtitle">7-Day Free Trial</AppText>
      <AppText variant="body">You're currently using {subscription.plan.name} features.</AppText>
      <AppText variant="body">{dayLine}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Choose a plan before your trial ends.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.successBackground,
    borderRadius: 16,
    gap: spacing.xs,
    padding: spacing.md,
  },
});
