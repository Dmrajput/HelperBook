import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import LeaveCard from "../../components/leave/LeaveCard";
import LeaveEmptyState from "../../components/leave/LeaveEmptyState";
import LeaveSummaryCard from "../../components/leave/LeaveSummaryCard";
import useLeave from "../../hooks/useLeave";
import { approveLeave } from "../../services/leaveService";
import { colors, spacing } from "../../theme";

export default function LeaveScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useLeave({ status: "pending" });
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");

  async function approve(leave, resolveAttendance) {
    setBusyId(leave.id);
    setActionError("");
    try {
      const result = await approveLeave(leave.id, { resolveAttendance });
      if (result.salaryWarning) {
        Alert.alert("Leave approved successfully.", result.salaryWarning);
      }
      await reload();
    } catch (approveError) {
      const message = approveError.message || "Unable to approve leave. Please try again.";
      if (!resolveAttendance && /already marked/i.test(message)) {
        Alert.alert("Attendance conflict", `${message}\n\nApprove leave anyway?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Approve", onPress: () => approve(leave, true) },
        ]);
      } else {
        setActionError(message);
      }
    } finally {
      setBusyId("");
    }
  }

  function confirmApprove(leave) {
    Alert.alert("Approve Leave?", `${leave.employeeName}\n${leave.startDate} – ${leave.endDate}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => approve(leave, false) },
    ]);
  }

  function confirmReject(leave) {
    navigation.navigate("LeaveDetail", { leaveId: leave.id });
  }

  const pendingCount = data?.summary?.pendingRequests ?? data?.total ?? data?.leaves?.length ?? 0;

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
              Leave
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Review and record staff leave
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave history"
            onPress={() => navigation.navigate("LeaveHistory")}
            style={styles.headerAction}
          >
            <Ionicons name="time-outline" size={20} color="#EA580C" />
          </Pressable>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={loading && Boolean(data)} onRefresh={reload} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {loading && !data ? (
            <View style={styles.skeleton} accessibilityLabel="Loading leave">
              <View style={styles.block} />
              <View style={styles.block} />
            </View>
          ) : null}
          {error && !data ? (
            <ErrorView title="Unable to load leave requests." message={error} onRetry={reload} />
          ) : null}

          {data ? (
            <>
              <LeaveSummaryCard summary={data.summary} />

              <View style={styles.sectionHeader}>
                <AppText variant="label" style={styles.sectionTitle}>
                  Pending requests
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {`${pendingCount} waiting`}
                </AppText>
              </View>

              {actionError ? (
                <AppText variant="caption" color={colors.error}>
                  {actionError}
                </AppText>
              ) : null}

              {data.leaves.length === 0 ? (
                <LeaveEmptyState
                  title="No pending leave requests"
                  message="All leave requests have been reviewed."
                />
              ) : (
                data.leaves.map((leave) => (
                  <View key={leave.id} style={styles.item}>
                    <LeaveCard
                      leave={leave}
                      onPress={() => navigation.navigate("LeaveDetail", { leaveId: leave.id })}
                    />
                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Reject leave"
                        accessibilityState={{ disabled: Boolean(busyId) }}
                        disabled={Boolean(busyId)}
                        onPress={() => confirmReject(leave)}
                        style={({ pressed }) => [
                          styles.rejectBtn,
                          pressed && !busyId && styles.pressed,
                          busyId && styles.actionDisabled,
                        ]}
                      >
                        <Ionicons name="close" size={16} color={busyId ? colors.disabledText : colors.error} />
                        <AppText variant="label" color={busyId ? colors.disabledText : colors.error}>
                          Reject
                        </AppText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Approve leave"
                        accessibilityState={{ disabled: Boolean(busyId), busy: busyId === leave.id }}
                        disabled={Boolean(busyId)}
                        onPress={() => confirmApprove(leave)}
                        style={({ pressed }) => [
                          styles.approveBtn,
                          pressed && !busyId && styles.pressed,
                          busyId && styles.approveDisabled,
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={busyId ? colors.disabledText : colors.textInverse}
                        />
                        <AppText variant="label" color={busyId ? colors.disabledText : colors.textInverse}>
                          {busyId === leave.id ? "Approving..." : "Approve"}
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Record leave"
            onPress={() => navigation.navigate("CreateLeave", { mode: "record" })}
            style={({ pressed }) => [styles.footerSecondary, pressed && styles.pressed]}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <AppText variant="label" color={colors.primary}>
              Record leave
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave request"
            onPress={() => navigation.navigate("CreateLeave", { mode: "request" })}
            style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <AppText variant="label" color={colors.textInverse}>
              Leave request
            </AppText>
          </Pressable>
        </View>
      </View>
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
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
  item: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  approveBtn: {
    flex: 1.2,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  approveDisabled: {
    backgroundColor: colors.disabled,
  },
  actionDisabled: {
    opacity: 0.7,
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.disabled,
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
  footerPrimary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
});
