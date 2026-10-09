import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
import AttendanceDateSelector from "../../components/attendance/AttendanceDateSelector";
import AttendanceStatusSelector from "../../components/attendance/AttendanceStatusSelector";
import BulkEmployeeSelector from "../../components/attendance/BulkEmployeeSelector";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import { colors, spacing } from "../../theme";
import { bulkMarkAttendance, getAttendanceByDate } from "../../services/attendanceService";
import { todayKey } from "../../utils/attendanceFormat";

export default function BulkAttendanceScreen({ navigation, route }) {
  const [date, setDate] = useState(route.params?.date || todayKey());
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceByDate(date);
      const active = data.employees.filter((employee) => employee.employeeStatus === "active" && date >= employee.joiningDate);
      setEmployees(active);
      setSelected(new Set());
    } catch (loadError) {
      setEmployees([]);
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function toggle(employeeId) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(employees.map((employee) => employee.employeeId)));
  }

  async function save(overwriteExisting) {
    const chosen = employees.filter((employee) => selected.has(employee.employeeId));
    setSaving(true);
    setSaveError("");
    try {
      const result = await bulkMarkAttendance({
        date,
        overwriteExisting,
        records: chosen.map((employee) => ({ employeeId: employee.employeeId, status, notes })),
      });
      if (result.failed > 0) {
        setSaveError(result.errors.map((item) => item.message).join("\n") || "Attendance could not be saved. Please try again.");
      } else {
        navigation.goBack();
      }
    } catch (saveFailure) {
      setSaveError(
        saveFailure?.isNetworkError
          ? "You're offline. Attendance cannot be saved until you're connected."
          : "Attendance could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmSave() {
    const chosen = employees.filter((employee) => selected.has(employee.employeeId));
    if (!chosen.length || saving) {
      return;
    }
    const existing = chosen.filter((employee) => employee.attendanceId);
    if (existing.length) {
      Alert.alert(
        "Some employees already have attendance marked for this date.",
        "Do you want to update their existing attendance?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Update", onPress: () => save(true) },
        ]
      );
      return;
    }
    save(false);
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          Bulk Attendance
        </AppText>
        <AttendanceDateSelector date={date} onChange={setDate} />
        <AppText variant="label">Status</AppText>
        <AttendanceStatusSelector value={status} onChange={setStatus} />
        <AppTextInput label="Reason / Note" value={notes} onChangeText={setNotes} maxLength={500} />
        {loading ? <AppText color={colors.textSecondary}>Loading attendance...</AppText> : null}
        {error && !employees.length ? (
          <ErrorView
            title="Unable to load attendance."
            message={error.isNetworkError ? "Please check your internet connection and try again." : error.message}
            onRetry={load}
          />
        ) : null}
        {!loading && !error && employees.length === 0 ? (
          <AttendanceEmptyState
            title="No active employees"
            message="Add employees before marking attendance."
            actionLabel="Add Employee"
            onAction={() => navigation.navigate("AddEmployee")}
          />
        ) : null}
        {employees.length ? (
          <>
            <View style={styles.selection}>
              <AppButton label="Select All" variant="secondary" onPress={selectAll} />
              <AppButton label="Deselect All" variant="secondary" onPress={() => setSelected(new Set())} />
            </View>
            <AppText variant="body">{selected.size} selected</AppText>
            <BulkEmployeeSelector employees={employees} selectedIds={selected} onToggle={toggle} />
          </>
        ) : null}
        <FieldError message={saveError} />
      </ScrollView>
      <View style={styles.footer}>
        <AppButton
          label={saving ? "Saving..." : "Save Attendance"}
          onPress={confirmSave}
          disabled={saving || selected.size === 0}
        />
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  selection: { gap: spacing.sm },
  footer: { gap: spacing.sm, paddingTop: spacing.md },
});
