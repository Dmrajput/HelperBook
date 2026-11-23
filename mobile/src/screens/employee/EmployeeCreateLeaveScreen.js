import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import LeaveDateRangePicker from "../../components/leave/LeaveDateRangePicker";
import LeaveTypeSelector from "../../components/leave/LeaveTypeSelector";
import { createEmployeeLeave } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { todayKey } from "../../utils/attendanceFormat";

export default function EmployeeCreateLeaveScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const today = todayKey();
  const [leaveType, setLeaveType] = useState("paid");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await createEmployeeLeave({ leaveType, startDate, endDate, reason });
      navigation.replace("EmployeeLeaveDetail", { leaveId: result.leave.id });
    } catch (submitError) {
      setError(submitError?.message || "Unable to send the leave request.");
      setLoading(false);
    }
  };

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
              Request leave
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Dates and a reason
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="sunny-outline" size={20} color="#EA580C" />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <AppText variant="label" style={styles.sectionTitle}>
              Leave type
            </AppText>
            <LeaveTypeSelector value={leaveType} onChange={setLeaveType} />
          </View>

          <View style={styles.card}>
            <AppText variant="label" style={styles.sectionTitle}>
              Dates
            </AppText>
            <LeaveDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={({ startDate: nextStart, endDate: nextEnd }) => {
                setStartDate(nextStart);
                setEndDate(nextEnd);
              }}
            />
          </View>

          <View style={styles.card}>
            <AppTextInput
              label="Reason"
              value={reason}
              onChangeText={setReason}
              placeholder="Optional note for your shop"
              multiline
            />
          </View>

          <FieldError message={error} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit request"
            accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading}
            onPress={submit}
            style={({ pressed }) => [
              styles.footerPrimary,
              pressed && !loading && styles.pressed,
              loading && styles.footerDisabled,
            ]}
          >
            <Ionicons name="send-outline" size={18} color={loading ? colors.disabledText : colors.textInverse} />
            <AppText variant="label" color={loading ? colors.disabledText : colors.textInverse}>
              {loading ? "Sending..." : "Submit request"}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerPrimary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.88,
  },
});
