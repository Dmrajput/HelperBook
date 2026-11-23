import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
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

const ICONS = {
  trial_started: "sparkles-outline",
  trial_expired: "time-outline",
  subscription_created: "checkmark-circle-outline",
  subscription_activated: "checkmark-circle-outline",
  subscription_renewed: "refresh-outline",
  subscription_upgraded: "arrow-up-circle-outline",
  subscription_downgraded: "arrow-down-circle-outline",
  subscription_cancelled: "close-circle-outline",
  subscription_expired: "alert-circle-outline",
  payment_success: "card-outline",
  payment_failed: "warning-outline",
  plan_changed: "swap-horizontal-outline",
};

function eventIcon(type) {
  return ICONS[type] || "ribbon-outline";
}

export default function SubscriptionHistoryScreen({ navigation }) {
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
      const data = await getSubscriptionHistory({ page: 1, limit: 20 });
      setRows(data.history || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load subscription history.");
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
              Subscription history
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Plan changes
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="ribbon-outline" size={20} color={colors.secondary} />
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
          <ErrorView title="Unable to load history." message={error} onRetry={() => load(false)} />
        ) : null}

        {!loading && !error ? (
          <View style={styles.sectionHeader}>
            <AppText variant="label" style={styles.sectionTitle}>
              Events
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {rows.length ? `${rows.length} shown` : "None yet"}
            </AppText>
          </View>
        ) : null}

        {!loading && !error && rows.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="ribbon-outline" size={22} color={colors.secondary} />
            </View>
            <AppText variant="label" style={styles.emptyTitle}>
              No subscription history yet
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              Plan changes will appear here.
            </AppText>
          </View>
        ) : null}

        {rows.map((row) => {
          const planLine = [row.fromPlanId, row.toPlanId].filter(Boolean).join(" → ");
          return (
            <View key={row.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name={eventIcon(row.eventType)} size={18} color={colors.secondary} />
              </View>
              <View style={styles.cardCopy}>
                <AppText variant="label" style={styles.cardTitle} numberOfLines={1}>
                  {LABELS[row.eventType] || "Subscription update"}
                </AppText>
                {planLine ? (
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {planLine}
                  </AppText>
                ) : null}
                <AppText variant="caption" color={colors.textSecondary}>
                  {formatAttendanceDate(row.createdAt.slice(0, 10))}
                </AppText>
              </View>
            </View>
          );
        })}
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
    backgroundColor: colors.secondaryLight,
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
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontWeight: "700",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
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
});
