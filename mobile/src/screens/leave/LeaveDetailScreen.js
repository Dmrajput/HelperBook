import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import LeaveApprovalActions from "../../components/leave/LeaveApprovalActions";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import { leaveTypeLabel } from "../../components/leave/LeaveTypeBadge";
import { approveLeave, cancelLeave, getLeave, rejectLeave } from "../../services/leaveService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

function InfoRow({ icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={14} color="#EA580C" />
      </View>
      <View style={styles.infoCopy}>
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText variant="label" style={styles.infoValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export default function LeaveDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { leaveId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getLeave(leaveId));
    } catch (loadError) {
      setError(loadError.message || "Unable to load leave requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [leaveId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const leave = data?.leave;

  async function approve(resolveAttendance) {
    setBusy("approve");
    setNotice("");
    try {
      const result = await approveLeave(leave.id, { resolveAttendance });
      setData(result);
      setNotice(result.salaryWarning || "Leave approved successfully.");
    } catch (actionError) {
      const message = actionError.message || "Unable to approve leave. Please try again.";
      if (!resolveAttendance && /already marked/i.test(message)) {
        Alert.alert("Attendance conflict", `${message}\n\nApprove leave and change that attendance to Leave?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Approve", onPress: () => approve(true) },
        ]);
      } else {
        setError(message);
      }
    } finally {
      setBusy("");
    }
  }

  async function reject(reason) {
    setBusy("reject");
    try {
      setData(await rejectLeave(leave.id, reason));
      setNotice("Leave rejected.");
    } catch (actionError) {
      setError(actionError.message || "Unable to reject leave. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function cancel() {
    setBusy("cancel");
    try {
      const result = await cancelLeave(leave.id);
      setData(result);
      setNotice(result.attendanceWarning || "Leave cancelled.");
    } catch (actionError) {
      setError(actionError.message || "Unable to cancel leave. Please try again.");
    } finally {
      setBusy("");
    }
  }

  const name = leave?.employeeName || "Request details";
  const initial = String(name || "E").trim().charAt(0).toUpperCase() || "E";

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
            <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
              Leave
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {name}
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="calendar-outline" size={20} color="#EA580C" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && !leave ? (
          <View style={styles.skeleton} accessibilityLabel="Loading leave">
            <View style={styles.block} />
          </View>
        ) : null}
        {error && !leave ? <ErrorView message={error} onRetry={load} /> : null}

        {leave ? (
          <>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <AppText variant="heading" color="#EA580C">
                  {initial}
                </AppText>
              </View>
              <AppText variant="subtitle" style={styles.heroName} numberOfLines={2}>
                {leave.employeeName}
              </AppText>
              <LeaveStatusBadge status={leave.status} />
            </View>

            <View style={styles.card}>
              <InfoRow icon="leaf-outline" label="Leave type" value={leaveTypeLabel(leave.leaveType)} />
              <InfoRow
                icon="calendar-outline"
                label="Dates"
                value={`${formatAttendanceDate(leave.startDate)} → ${formatAttendanceDate(leave.endDate)}`}
              />
              <InfoRow
                icon="time-outline"
                label="Duration"
                value={`${leave.totalDays} ${leave.totalDays === 1 ? "day" : "days"}`}
              />
              <InfoRow
                icon="wallet-outline"
                label="Salary treatment"
                value={leave.salaryTreatment === "paid" ? "Paid" : "Unpaid"}
              />
              <InfoRow icon="document-text-outline" label="Reason" value={leave.reason || "Not added"} />
              <InfoRow icon="close-circle-outline" label="Rejection reason" value={leave.rejectionReason} />
            </View>

            <View style={styles.card}>
              <LeaveApprovalActions
                leave={leave}
                busy={busy}
                onApprove={approve}
                onReject={reject}
                onCancel={cancel}
              />
            </View>
          </>
        ) : null}

        {notice ? (
          <View style={styles.notice}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <AppText variant="caption" color={colors.success} style={styles.noticeText}>
              {notice}
            </AppText>
          </View>
        ) : null}
        <FieldError message={leave ? error : ""} />
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
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoValue: {
    fontWeight: "700",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.successBackground,
    borderRadius: 14,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
  },
});
