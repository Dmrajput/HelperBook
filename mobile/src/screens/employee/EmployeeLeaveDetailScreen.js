import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import { leaveTypeLabel } from "../../components/leave/LeaveTypeBadge";
import { cancelEmployeeLeave, getEmployeeLeave } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

function rangeLabel(leave) {
  if (!leave) return "";
  if (leave.startDate === leave.endDate) return formatAttendanceDate(leave.startDate);
  return `${formatAttendanceDate(leave.startDate)} – ${formatAttendanceDate(leave.endDate)}`;
}

export default function EmployeeLeaveDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const leaveId = route?.params?.leaveId;
  const [leave, setLeave] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getEmployeeLeave(leaveId);
      setLeave(data.leave);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "You don't have access to this information.");
    } finally {
      setLoading(false);
    }
  }, [leaveId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const cancel = () => {
    Alert.alert("Cancel leave", "Cancel this leave request?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel leave",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            const data = await cancelEmployeeLeave(leaveId);
            setLeave(data.leave);
          } catch (cancelError) {
            setError(cancelError?.message || "Unable to cancel this leave.");
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const canCancel = leave?.status === "pending" || leave?.status === "approved";

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
              Leave details
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Request overview
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="sunny-outline" size={20} color="#EA580C" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error && !leave ? <ErrorView message={error} onRetry={load} /> : null}

        {leave ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <AppText variant="label" style={styles.heroTitle}>
                  {leaveTypeLabel(leave.leaveType)}
                </AppText>
                <LeaveStatusBadge status={leave.status} />
              </View>
              <AppText variant="heading" style={styles.days}>
                {`${leave.totalDays} ${leave.totalDays === 1 ? "day" : "days"}`}
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {rangeLabel(leave)}
              </AppText>
            </View>

            <View style={styles.card}>
              <InfoRow icon="calendar-outline" label="Dates" value={rangeLabel(leave)} />
              <InfoRow icon="pricetag-outline" label="Type" value={leaveTypeLabel(leave.leaveType)} />
              <InfoRow icon="time-outline" label="Total days" value={String(leave.totalDays)} last={!leave.reason} />
              {leave.reason ? <InfoRow icon="chatbubble-outline" label="Reason" value={leave.reason} last /> : null}
            </View>

            {leave.rejectionReason ? (
              <View style={styles.rejectCard}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <View style={styles.rejectCopy}>
                  <AppText variant="label" color={colors.error}>
                    Rejection reason
                  </AppText>
                  <AppText variant="body" color={colors.textSecondary}>
                    {leave.rejectionReason}
                  </AppText>
                </View>
              </View>
            ) : null}

            {error ? (
              <AppText variant="body" color={colors.error}>
                {error}
              </AppText>
            ) : null}
          </>
        ) : null}

        {loading && !leave ? (
          <AppText variant="body" color={colors.textSecondary}>
            Loading...
          </AppText>
        ) : null}
      </ScrollView>

      {canCancel ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel request"
            accessibilityState={{ disabled: cancelling, busy: cancelling }}
            disabled={cancelling}
            onPress={cancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && !cancelling && styles.pressed]}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <AppText variant="label" color={colors.error}>
              {cancelling ? "Cancelling..." : "Cancel request"}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color="#EA580C" />
      </View>
      <View style={styles.infoCopy}>
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText variant="body">{value}</AppText>
      </View>
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
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroTitle: {
    fontWeight: "700",
    flex: 1,
  },
  days: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  infoBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  rejectCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.errorBackground,
    borderRadius: 16,
    padding: spacing.md,
  },
  rejectCopy: {
    flex: 1,
    gap: 4,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelBtn: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.88,
  },
});
