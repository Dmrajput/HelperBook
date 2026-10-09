import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBadge from "../../components/StatusBadge";
import { getEmployeeAdvances } from "../../services/advanceService";
import { getEmployeeSalaryHistory } from "../../services/salaryService";
import { getEmployeeLeaves } from "../../services/leaveService";
import { getEmployeeAttendance } from "../../services/attendanceService";
import { deleteEmployee, getEmployeeById, setEmployeeLogin, updateEmployeeStatus } from "../../services/employeeService";
import { formatAttendanceDate, monthStartKey, todayKey } from "../../utils/attendanceFormat";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";
import { formatJoiningDate, formatPhone, roleLabel } from "../../utils/employeeFormat";
import { showEmployeeLimitAlert } from "../../utils/employeeLimit";

export default function EmployeeProfileScreen({ navigation, route }) {
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [advance, setAdvance] = useState(null);
  const [advanceLoading, setAdvanceLoading] = useState(true);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [latestSalary, setLatestSalary] = useState(null);

  const loadEmployee = useCallback(async () => {
    setError("");
    try {
      const nextEmployee = await getEmployeeById(employeeId);
      setEmployee(nextEmployee);
      try {
        const khata = await getEmployeeAdvances(employeeId, { limit: 1 });
        setAdvance(khata.summary);
      } catch {
        setAdvance(null);
      } finally {
        setAdvanceLoading(false);
      }
      try {
        const leave = await getEmployeeLeaves(employeeId, { limit: 1 });
        setLeaveSummary(leave.summary);
      } catch {
        setLeaveSummary(null);
      } finally {
        setLeaveLoading(false);
      }
      try {
        const salaries = await getEmployeeSalaryHistory(employeeId, { limit: 1 });
        setLatestSalary(salaries.salaries?.[0] || null);
      } catch {
        setLatestSalary(null);
      }
      try {
        const history = await getEmployeeAttendance(employeeId, {
          startDate: monthStartKey(),
          endDate: todayKey(),
          limit: 1,
        });
        setAttendance(history.summary);
      } catch {
        setAttendance(null);
      }
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
      if (status === "active" && statusError?.code === "EMPLOYEE_LIMIT_REACHED") {
        showEmployeeLimitAlert(navigation, statusError);
        return;
      }
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
          <AppText variant="subtitle">Attendance Summary</AppText>
          <AppText variant="body">Present {attendance?.present ?? 0}</AppText>
          <AppText variant="body">Absent {attendance?.absent ?? 0}</AppText>
          <AppText variant="body">Half Day {attendance?.halfDay ?? 0}</AppText>
          <AppText variant="body">Leave {attendance?.leave ?? 0}</AppText>
          <AppButton
            label="View Attendance History"
            variant="secondary"
            onPress={() => navigation.navigate("EmployeeAttendance", { employeeId: employee.id })}
          />
        </View>
        <View style={styles.section}>
          <AppText variant="subtitle">Salary</AppText>
          <AppText variant="body">
            Current Salary {formatInr(employee.salary?.amount)} / {employee.salary?.type === "daily" ? "day" : "month"}
          </AppText>
          {latestSalary ? (
            <>
              <AppText variant="body">Latest Salary {formatInr(latestSalary.calculation?.netSalary)}</AppText>
              <AppText variant="body">
                Payment Status{" "}
                {latestSalary.status !== "finalized"
                  ? "Not finalized"
                  : latestSalary.paymentStatus === "paid"
                    ? "PAID"
                    : "UNPAID"}
              </AppText>
              {latestSalary.paymentStatus === "paid" && latestSalary.payment?.paymentDate ? (
                <AppText variant="body">
                  Last Paid {formatAttendanceDate(latestSalary.payment.paymentDate)} · {methodLabel(latestSalary.payment.paymentMethod)}
                </AppText>
              ) : null}
              {latestSalary.status === "finalized" && latestSalary.paymentStatus === "paid" ? (
                <AppButton
                  label="View Receipt"
                  variant="secondary"
                  onPress={() => navigation.navigate("SalaryReceipt", { salaryId: latestSalary.id })}
                />
              ) : null}
            </>
          ) : (
            <AppText variant="body" color={colors.textSecondary}>
              No salary records yet.
            </AppText>
          )}
          <AppButton
            label="View Salary History"
            variant="secondary"
            onPress={() => navigation.navigate("SalaryHistory", { employeeId: employee.id })}
          />
        </View>
        <View style={styles.section}>
          <AppText variant="subtitle">Leave</AppText>
          {leaveLoading ? (
            <AppText variant="body" color={colors.textSecondary}>
              Loading leave...
            </AppText>
          ) : leaveSummary ? (
            <>
              <AppText variant="body">Paid leave {leaveSummary.paidDays} days</AppText>
              <AppText variant="body">Unpaid leave {leaveSummary.unpaidDays} days</AppText>
              <AppText variant="body">Sick leave {leaveSummary.sickDays} days</AppText>
              <AppText variant="body">Pending requests {leaveSummary.pending}</AppText>
            </>
          ) : (
            <AppText variant="body">Leave information is unavailable.</AppText>
          )}
          <AppButton
            label="View Leave History"
            variant="secondary"
            onPress={() => navigation.navigate("LeaveHistory", { employeeId: employee.id })}
          />
          {employee.status === "active" ? (
            <AppButton
              label="Leave Request"
              variant="secondary"
              onPress={() =>
                navigation.navigate("CreateLeave", {
                  mode: "request",
                  employeeId: employee.id,
                  employeeName: employee.name,
                })
              }
            />
          ) : null}
        </View>
        <View style={styles.section}>
          <AppText variant="subtitle">Advance / Khata</AppText>
          {advanceLoading ? (
            <AppText variant="body" color={colors.textSecondary}>
              Loading advance...
            </AppText>
          ) : (
            <AppText variant="body">
              Advance outstanding {advance ? formatInr(advance.outstanding) : "Unavailable"}
            </AppText>
          )}
          <AppButton
            label="View Khata"
            variant="secondary"
            onPress={() => navigation.navigate("EmployeeAdvance", { employeeId: employee.id })}
          />
          {employee.status === "active" ? (
            <AppButton
              label="Give Advance"
              variant="secondary"
              onPress={() => navigation.navigate("GiveAdvance", { employeeId: employee.id, employeeName: employee.name })}
            />
          ) : (
            <AppText variant="body" color={colors.textSecondary}>
              Employee is inactive. New advances cannot be given.
            </AppText>
          )}
        </View>
        <View style={styles.section}>
          <AppText variant="subtitle">Employee Login</AppText>
          <AppText variant="body">Phone {employee.phone ? formatPhone(employee.phone) : "Not added"}</AppText>
          <AppText variant="body">Login {employee.loginEnabled ? "Enabled" : "Disabled"}</AppText>
          <AppText variant="body">
            Last Login {employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Not yet"}
          </AppText>
          {!employee.phone ? (
            <AppText variant="body" color={colors.textSecondary}>Add phone number to enable login</AppText>
          ) : (
            <AppButton
              label={employee.loginEnabled ? "Disable Login" : "Enable Login"}
              variant="secondary"
              disabled={Boolean(busy)}
              onPress={async () => {
                setBusy(employee.loginEnabled ? "Disabling login..." : "Enabling login...");
                try {
                  const result = await setEmployeeLogin(employee.id, !employee.loginEnabled);
                  setEmployee((current) => (current ? { ...current, loginEnabled: result.loginEnabled } : current));
                } catch (loginError) {
                  Alert.alert("Employee Login", loginError?.message || "Unable to update employee login.");
                } finally {
                  setBusy("");
                }
              }}
            />
          )}
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
