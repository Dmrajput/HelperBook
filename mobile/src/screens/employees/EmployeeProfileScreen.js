import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBadge from "../../components/StatusBadge";
import { deleteEmployee, getEmployeeById, updateEmployeeStatus } from "../../services/employeeService";
import { colors, spacing } from "../../theme";
import { formatJoiningDate, formatPhone, formatSalary, roleLabel } from "../../utils/employeeFormat";

export default function EmployeeProfileScreen({ navigation, route }) {
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadEmployee = useCallback(async () => {
    setError("");
    try {
      const nextEmployee = await getEmployeeById(employeeId);
      setEmployee(nextEmployee);
    } catch (loadError) {
      setEmployee(null);
      setError(loadError?.message || "Employee not found.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadEmployee();
    }, [loadEmployee])
  );

  async function changeStatus(status) {
    if (busy) {
      return;
    }
    setBusy(status === "active" ? "Reactivating..." : "Deactivating...");
    setError("");
    try {
      const updated = await updateEmployeeStatus(employeeId, status);
      setEmployee(updated);
      Alert.alert(status === "active" ? "Employee reactivated successfully." : "Employee deactivated successfully.");
    } catch (statusError) {
      setError(statusError?.message || "Please check the employee details.");
    } finally {
      setBusy("");
    }
  }

  function confirmStatus() {
    if (!employee || busy) {
      return;
    }
    const inactive = employee.status === "inactive";
    Alert.alert(
      inactive ? `Reactivate ${employee.name}?` : `Deactivate ${employee.name}?`,
      inactive
        ? `${employee.name} will appear in your active employee list again.`
        : `${employee.name} will no longer appear in your active employee list, but their records will be preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: inactive ? "Reactivate" : "Deactivate",
          style: inactive ? "default" : "destructive",
          onPress: () => changeStatus(inactive ? "active" : "inactive"),
        },
      ]
    );
  }

  function confirmDelete() {
    Alert.alert("Delete employee permanently?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Permanently", style: "destructive", onPress: removeEmployee },
    ]);
  }

  async function removeEmployee() {
    if (busy) {
      return;
    }
    setBusy("Deleting...");
    setError("");
    try {
      await deleteEmployee(employeeId);
      Alert.alert("Employee deleted successfully.", "", [
        { text: "OK", onPress: () => navigation.navigate("EmployeeList") },
      ]);
    } catch (deleteError) {
      setError(deleteError?.message || "Please check the employee details.");
      setBusy("");
    }
  }

  if (loading && !employee) {
    return (
      <ScreenContainer>
        <AppText color={colors.textSecondary}>Loading employee...</AppText>
      </ScreenContainer>
    );
  }

  if (!employee) {
    return (
      <ScreenContainer>
        <ErrorView title="Employee not found." message={error} onRetry={loadEmployee} />
        <View style={styles.footer}>
          <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="heading" accessibilityRole="header">
          {employee.name}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {roleLabel(employee)}
        </AppText>
        <StatusBadge status={employee.status} />
        <View style={styles.section}>
          <AppText variant="subtitle">Basic information</AppText>
          <Info label="Phone" value={employee.phone ? formatPhone(employee.phone) : "Not added"} />
          <Info label="Joining date" value={formatJoiningDate(employee.joiningDate)} />
          <Info label="Role" value={roleLabel(employee)} />
        </View>
        <View style={styles.section}>
          <AppText variant="subtitle">Salary</AppText>
          <AppText variant="body">{formatSalary(employee.salary)}</AppText>
        </View>
        {employee.notes ? (
          <View style={styles.section}>
            <AppText variant="subtitle">Notes</AppText>
            <AppText variant="body">{employee.notes}</AppText>
          </View>
        ) : null}
        <FieldError message={error} />
      </ScrollView>
      <View style={styles.footer}>
        <AppButton
          label="Edit Employee"
          onPress={() => navigation.navigate("EditEmployee", { employeeId: employee.id })}
          disabled={Boolean(busy)}
        />
        <AppButton
          label={busy && busy !== "Deleting..." ? busy : employee.status === "active" ? "Deactivate Employee" : "Reactivate Employee"}
          variant="secondary"
          onPress={confirmStatus}
          disabled={Boolean(busy)}
        />
        <AppButton
          label={busy === "Deleting..." ? "Deleting..." : "More"}
          variant="secondary"
          onPress={() =>
            Alert.alert("More", undefined, [
              { text: "Delete permanently", style: "destructive", onPress: confirmDelete },
              { text: "Cancel", style: "cancel" },
            ])
          }
          disabled={Boolean(busy)}
        />
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} disabled={Boolean(busy)} />
      </View>
    </ScreenContainer>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.info}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.lg },
  section: { gap: spacing.sm },
  info: { gap: spacing.xs },
  footer: { gap: spacing.sm, paddingTop: spacing.md },
});
