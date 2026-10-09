import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import LeaveDateRangePicker from "../../components/leave/LeaveDateRangePicker";
import LeaveTypeSelector from "../../components/leave/LeaveTypeSelector";
import AppScreen from "../../components/AppScreen";
import { getEmployees } from "../../services/employeeService";
import { createLeave, recordLeave } from "../../services/leaveService";
import { getMyShop } from "../../services/shopService";
import { colors, spacing } from "../../theme";
import { todayKey } from "../../utils/attendanceFormat";

export default function CreateLeaveScreen({ navigation, route }) {
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

  const treatment = leaveType === "paid" ? "Paid" : leaveType === "unpaid" ? "Unpaid" : sickTreatment === "paid" ? "Paid" : "Unpaid";
  const past = range.startDate < todayKey();

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
    <AppScreen title={mode === "record" ? "Record leave" : "Leave request"} subtitle={presetName || "Choose dates and a reason"} icon="calendar">
      <ScrollView contentContainerStyle={styles.scroll}>
        {presetName ? <AppText variant="subtitle">{presetName}</AppText> : null}
        {!presetId ? (
          <View style={styles.list}>
            <AppText variant="label">Employee</AppText>
            {employees.map((employee) => {
              const selected = employeeId === employee.id;
              return (
                <Pressable
                  key={employee.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setEmployeeId(employee.id)}
                  style={[styles.choice, selected && styles.selected]}
                >
                  <AppText color={selected ? colors.textInverse : colors.text}>{employee.name}</AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <LeaveTypeSelector value={leaveType} onChange={setLeaveType} />
        <AppText variant="body">Salary treatment {treatment}</AppText>
        <LeaveDateRangePicker startDate={range.startDate} endDate={range.endDate} onChange={setRange} />
        <AppTextInput label="Reason" value={reason} onChangeText={setReason} placeholder="Family function" />
        {mode === "record" && past ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: confirmHistorical }}
            onPress={() => setConfirmHistorical((current) => !current)}
            style={[styles.choice, confirmHistorical && styles.selected]}
          >
            <AppText color={confirmHistorical ? colors.textInverse : colors.text}>
              I am recording past leave
            </AppText>
          </Pressable>
        ) : null}
        <FieldError message={error} />
        <AppButton
          label={mode === "record" ? "Record Leave" : "Submit Request"}
          onPress={submit}
          loading={loading}
          disabled={loading}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  list: { gap: spacing.sm },
  choice: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
