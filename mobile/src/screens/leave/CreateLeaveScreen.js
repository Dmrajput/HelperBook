import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import LeaveDateRangePicker from "../../components/leave/LeaveDateRangePicker";
import LeaveTypeSelector from "../../components/leave/LeaveTypeSelector";
import { getEmployees } from "../../services/employeeService";
import { createLeave, recordLeave } from "../../services/leaveService";
import { getMyShop } from "../../services/shopService";
import { colors, spacing } from "../../theme";
import { todayKey } from "../../utils/attendanceFormat";

export default function CreateLeaveScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mode = route.params?.mode === "record" ? "record" : "request";
  const presetId = route.params?.employeeId || "";
  const presetName = route.params?.employeeName || "";
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState(presetId);
  const [leaveType, setLeaveType] = useState("paid");
  const [range, setRange] = useState({ startDate: todayKey(), endDate: todayKey() });
  const [reason, setReason] = useState("");
  const [confirmHistorical, setConfirmHistorical] = useState(false);
  const [sickTreatment, setSickTreatment] = useState("unpaid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyShop()
      .then((shop) => {
        if (active) setSickTreatment(shop?.settings?.leaveSettings?.sickLeaveTreatment || "unpaid");
      })
      .catch(() => {});
    if (!presetId) {
      getEmployees({ status: "active", limit: 50 })
        .then((data) => {
          if (active) setEmployees(data.employees || []);
        })
        .catch((loadError) => {
          if (active) setError(loadError.message);
        });
    }
    return () => {
      active = false;
    };
  }, [presetId]);

  const treatment =
    leaveType === "paid" ? "Paid" : leaveType === "unpaid" ? "Unpaid" : sickTreatment === "paid" ? "Paid" : "Unpaid";
  const past = range.startDate < todayKey();
  const title = mode === "record" ? "Record leave" : "Leave request";
  const subtitle = presetName || "Choose dates and a reason";

  async function submit() {
    if (loading) return;
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (mode === "record" && past && !confirmHistorical) {
      setError("Confirm that you are recording historical leave.");
      return;
    }
    setLoading(true);
    setError("");
    const payload = {
      employeeId,
      leaveType,
      startDate: range.startDate,
      endDate: range.endDate,
      reason: reason.trim(),
      ...(mode === "record" ? { confirmHistorical: past } : {}),
    };
    try {
      if (mode === "record") await recordLeave(payload);
      else await createLeave(payload);
      navigation.goBack();
    } catch (submitError) {
      setError(submitError.message || "Unable to save leave. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
              {title}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="calendar-outline" size={20} color="#EA580C" />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!presetId ? (
            <View style={styles.card}>
              <AppText variant="label" style={styles.sectionTitle}>
                Employee
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.employeeRow}>
                {employees.map((employee) => {
                  const selected = employeeId === employee.id;
                  return (
                    <Pressable
                      key={employee.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setEmployeeId(employee.id)}
                      style={[styles.employeeChip, selected && styles.employeeChipSelected]}
                    >
                      <AppText
                        variant="caption"
                        color={selected ? colors.primary : colors.textSecondary}
                        style={styles.chipText}
                        numberOfLines={1}
                      >
                        {employee.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.employeeBanner}>
              <View style={styles.avatar}>
                <AppText variant="label" color="#EA580C" style={styles.avatarLetter}>
                  {String(presetName || "E").trim().charAt(0).toUpperCase() || "E"}
                </AppText>
              </View>
              <View style={styles.employeeCopy}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Employee
                </AppText>
                <AppText variant="label" style={styles.employeeName} numberOfLines={1}>
                  {presetName}
                </AppText>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <AppText variant="label" style={styles.sectionTitle}>
              Leave type
            </AppText>
            <LeaveTypeSelector value={leaveType} onChange={setLeaveType} />
            <View style={styles.treatment}>
              <Ionicons name="wallet-outline" size={14} color={colors.primary} />
              <AppText variant="caption" color={colors.textSecondary}>
                {`Salary treatment: ${treatment}`}
              </AppText>
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="label" style={styles.sectionTitle}>
              Dates
            </AppText>
            <LeaveDateRangePicker startDate={range.startDate} endDate={range.endDate} onChange={setRange} />
            <AppTextInput label="Reason" value={reason} onChangeText={setReason} placeholder="Family function" />
            {mode === "record" && past ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: confirmHistorical }}
                onPress={() => setConfirmHistorical((current) => !current)}
                style={[styles.confirmRow, confirmHistorical && styles.confirmSelected]}
              >
                <View style={[styles.check, confirmHistorical && styles.checkSelected]}>
                  {confirmHistorical ? <Ionicons name="checkmark" size={14} color={colors.textInverse} /> : null}
                </View>
                <AppText variant="body" color={colors.text} style={styles.confirmText}>
                  I am recording past leave
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <FieldError message={error} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === "record" ? "Record leave" : "Submit request"}
            accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading}
            onPress={submit}
            style={({ pressed }) => [
              styles.footerPrimary,
              pressed && !loading && styles.pressed,
              loading && styles.footerDisabled,
            ]}
          >
            <Ionicons
              name={mode === "record" ? "create-outline" : "send-outline"}
              size={18}
              color={loading ? colors.disabledText : colors.textInverse}
            />
            <AppText variant="label" color={loading ? colors.disabledText : colors.textInverse}>
              {loading ? "Saving..." : mode === "record" ? "Record leave" : "Submit request"}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  employeeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  employeeChip: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  employeeChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontWeight: "700",
  },
  employeeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "800",
  },
  employeeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  employeeName: {
    fontWeight: "700",
  },
  treatment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  confirmSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  confirmText: {
    flex: 1,
  },
  footer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
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
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
