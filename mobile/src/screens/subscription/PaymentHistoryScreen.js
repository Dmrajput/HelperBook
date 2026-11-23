import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import PaymentStatusBadge from "../../components/subscription/PaymentStatusBadge";
import { getPaymentHistory } from "../../services/subscriptionService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

export default function PaymentHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

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
              Payment history
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Subscription payments
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && rows.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
        {error && rows.length === 0 ? (
          <ErrorView title="Unable to load payments." message={error} onRetry={() => load(false)} />
        ) : null}

        {!loading && !error ? (
          <View style={styles.sectionHeader}>
            <AppText variant="label" style={styles.sectionTitle}>
              Payments
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {rows.length ? `${rows.length} shown` : "None yet"}
            </AppText>
          </View>
        ) : null}

        {!loading && !error && rows.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={22} color={colors.primary} />
            </View>
            <AppText variant="label" style={styles.emptyTitle}>
              No subscription payments yet
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              Payments will appear here after you subscribe.
            </AppText>
          </View>
        ) : null}

        {rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardIcon}>
                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.cardCopy}>
                <AppText variant="label" style={styles.cardTitle} numberOfLines={1}>
                  {row.planName}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {row.billingInterval === "yearly" ? "Yearly" : "Monthly"}
                </AppText>
              </View>
              <PaymentStatusBadge status={row.status} />
            </View>
            <View style={styles.cardBottom}>
              <AppText variant="heading" style={styles.amount}>
                {formatInr(row.amount)}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {formatAttendanceDate((row.paidAt || row.createdAt).slice(0, 10))}
              </AppText>
            </View>
            {row.reference ? (
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                Ref {row.reference}
              </AppText>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    paddingBottom: spacing.xl,
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
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTitle: {
    fontWeight: "700",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  amount: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
});
