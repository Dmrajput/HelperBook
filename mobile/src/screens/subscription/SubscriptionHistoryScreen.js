import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import { getSubscriptionHistory } from "../../services/subscriptionService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

const LABELS = {
  trial_started: "Trial started",
  trial_expired: "Trial ended",
  subscription_created: "Free plan started",
  subscription_activated: "Plan activated",
  subscription_renewed: "Plan renewed",
  subscription_upgraded: "Plan upgraded",
  subscription_downgraded: "Plan downgraded",
  subscription_cancelled: "Cancellation scheduled",
  subscription_expired: "Subscription expired",
  payment_success: "Payment received",
  payment_failed: "Payment failed",
  plan_changed: "Plan change scheduled",
};

export default function SubscriptionHistoryScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await getSubscriptionHistory({ page: 1, limit: 20 });
      setRows(data.history || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load subscription history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <AppText variant="heading" accessibilityRole="header">Subscription History</AppText>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <ErrorView title="Unable to load history." message={error} onRetry={() => load(false)} /> : null}
        {!loading && !error && rows.length === 0 ? (
          <AppText variant="body" color={colors.textSecondary}>No subscription history yet.</AppText>
        ) : null}
        {rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <AppText variant="subtitle">{LABELS[row.eventType] || "Subscription update"}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {[row.fromPlanId, row.toPlanId].filter(Boolean).join(" → ")}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>{formatAttendanceDate(row.createdAt.slice(0, 10))}</AppText>
          </View>
        ))}
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
});
