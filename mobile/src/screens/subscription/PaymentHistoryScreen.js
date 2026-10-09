import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import PaymentStatusBadge from "../../components/subscription/PaymentStatusBadge";
import { getPaymentHistory } from "../../services/subscriptionService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

export default function PaymentHistoryScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await getPaymentHistory({ page: 1, limit: 20 });
      setRows(data.payments || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load payments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  return (
    <AppScreen title="Payment history" subtitle="Subscription payments" icon="card">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <ErrorView title="Unable to load payments." message={error} onRetry={() => load(false)} /> : null}
        {!loading && !error && rows.length === 0 ? (
          <AppText variant="body" color={colors.textSecondary}>No subscription payments yet.</AppText>
        ) : null}
        {rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <AppText variant="subtitle">{row.planName}</AppText>
            <AppText variant="body">{row.billingInterval === "yearly" ? "Yearly" : "Monthly"}</AppText>
            <AppText variant="heading">₹{row.amount}</AppText>
            <PaymentStatusBadge status={row.status} />
            <AppText variant="caption" color={colors.textSecondary}>
              {formatAttendanceDate((row.paidAt || row.createdAt).slice(0, 10))}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>{row.reference}</AppText>
          </View>
        ))}
      </ScrollView>
    </AppScreen>
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
