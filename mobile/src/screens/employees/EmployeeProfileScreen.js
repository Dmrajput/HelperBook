import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
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
      <AppScreen title="Employee" subtitle="Loading" icon="person">
        <AppText color={colors.textSecondary}>Loading employee...</AppText>
      </AppScreen>
    );
  }

  if (!employee) {
    return (
      <AppScreen title="Employee" subtitle="Not found" icon="person">
        <ErrorView title="Employee not found." message={error} onRetry={loadEmployee} />
      </AppScreen>
    );
  }

  const salaryLabel = latestSalary
    ? latestSalary.status !== "finalized"
      ? "Not finalized"
      : latestSalary.paymentStatus === "paid"
        ? "Paid"
        : "Unpaid"
    : "";
  const attendanceTiles = [
    { label: "Present", value: attendance?.present ?? 0, color: "#1C8A52", background: "#E8F8EF" },
    { label: "Absent", value: attendance?.absent ?? 0, color: "#D4535E", background: "#FDECEC" },
    { label: "Half Day", value: attendance?.halfDay ?? 0, color: "#C8881A", background: "#FFF6E4" },
    { label: "Leave", value: attendance?.leave ?? 0, color: "#4C6FE0", background: "#EEF3FF" },
  ];

  return (
    <AppScreen title={employee.name} subtitle={roleLabel(employee)} icon="person">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <AppText variant="label" color={colors.primary}>
              {String(employee.name || "A").trim().charAt(0).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.heroCopy}>
            <StatusBadge status={employee.status} />
            <AppText variant="caption" color={colors.textSecondary}>
              {employee.phone ? formatPhone(employee.phone) : "Phone not added"}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Joined {formatJoiningDate(employee.joiningDate)}
            </AppText>
          </View>
        </View>

        <Section title="This month">
          <View style={styles.tiles}>
            {attendanceTiles.map((tile) => (
              <View key={tile.label} style={[styles.tile, { backgroundColor: tile.background }]}>
                <AppText variant="subtitle" align="center" color={tile.color}>{String(tile.value)}</AppText>
                <AppText variant="caption" align="center" color={colors.textSecondary} numberOfLines={1}>{tile.label}</AppText>
              </View>
            ))}
          </View>
          <LinkRow
            label="Attendance history"
            onPress={() => navigation.navigate("EmployeeAttendance", { employeeId: employee.id })}
          />
        </Section>

        <Section title="Salary">
          <Info label="Current pay" value={`${formatInr(employee.salary?.amount)} / ${employee.salary?.type === "daily" ? "day" : "month"}`} />
          {latestSalary ? (
            <>
              <Info label="Latest salary" value={`${formatInr(latestSalary.calculation?.netSalary)} · ${salaryLabel}`} />
              {latestSalary.paymentStatus === "paid" && latestSalary.payment?.paymentDate ? (
                <Info
                  label="Last paid"
                  value={`${formatAttendanceDate(latestSalary.payment.paymentDate)} · ${methodLabel(latestSalary.payment.paymentMethod)}`}
                />
              ) : null}
            </>
          ) : (
            <AppText variant="caption" color={colors.textSecondary}>No salary records yet.</AppText>
          )}
          <LinkRow label="Salary history" onPress={() => navigation.navigate("SalaryHistory", { employeeId: employee.id })} />
          {latestSalary?.status === "finalized" && latestSalary?.paymentStatus === "paid" ? (
            <LinkRow label="View receipt" onPress={() => navigation.navigate("SalaryReceipt", { salaryId: latestSalary.id })} />
          ) : null}
        </Section>

        <Section title="Leave">
          {leaveLoading ? (
            <AppText variant="caption" color={colors.textSecondary}>Loading leave...</AppText>
          ) : leaveSummary ? (
            <AppText variant="body">
              {`Paid ${leaveSummary.paidDays} · Unpaid ${leaveSummary.unpaidDays} · Sick ${leaveSummary.sickDays} · Pending ${leaveSummary.pending}`}
            </AppText>
          ) : (
            <AppText variant="caption" color={colors.textSecondary}>Leave information is unavailable.</AppText>
          )}
          <LinkRow label="Leave history" onPress={() => navigation.navigate("LeaveHistory", { employeeId: employee.id })} />
          {employee.status === "active" ? (
            <LinkRow
              label="New leave request"
              onPress={() =>
                navigation.navigate("CreateLeave", {
                  mode: "request",
                  employeeId: employee.id,
                  employeeName: employee.name,
                })
              }
            />
          ) : null}
        </Section>

        <Section title="Advance / Khata">
          {advanceLoading ? (
            <AppText variant="caption" color={colors.textSecondary}>Loading advance...</AppText>
          ) : (
            <Info label="Outstanding" value={advance ? formatInr(advance.outstanding) : "Unavailable"} />
          )}
          <LinkRow label="View khata" onPress={() => navigation.navigate("EmployeeAdvance", { employeeId: employee.id })} />
          {employee.status === "active" ? (
            <LinkRow
              label="Give advance"
              onPress={() => navigation.navigate("GiveAdvance", { employeeId: employee.id, employeeName: employee.name })}
            />
          ) : (
            <AppText variant="caption" color={colors.textSecondary}>
              This employee is inactive. New advances cannot be given.
            </AppText>
          )}
        </Section>

        <Section title="Login">
          <Info label="Phone" value={employee.phone ? formatPhone(employee.phone) : "Not added"} />
          <Info label="Login" value={employee.loginEnabled ? "Enabled" : "Disabled"} />
          {employee.loginEnabled ? (
            <AppText variant="caption" color={colors.textSecondary}>
              They sign in from Employee Login. The first time, they use Forgot password to choose a password.
            </AppText>
          ) : null}
          <Info
            label="Last login"
            value={employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Not yet"}
          />
          {!employee.phone ? (
            <AppText variant="caption" color={colors.textSecondary}>Add a phone number to enable login.</AppText>
          ) : (
            <AppButton
              label={employee.loginEnabled ? "Disable login" : "Enable login"}
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
        </Section>

        {employee.notes ? (
          <Section title="Notes">
            <AppText variant="body">{employee.notes}</AppText>
          </Section>
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
      </View>
    </AppScreen>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>{title}</AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.info}>
      <AppText variant="caption" color={colors.textSecondary}>{label}</AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

function LinkRow({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.link}>
      <AppText variant="label" color={colors.primary} style={styles.linkLabel}>{label}</AppText>
      <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.lg },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tiles: {
    flexDirection: "row",
    gap: 6,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    alignItems: "center",
    gap: 2,
  },
  info: { gap: 2 },
  link: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
    gap: spacing.sm,
  },
  linkLabel: { flex: 1 },
  footer: { gap: spacing.sm, paddingTop: spacing.sm },
});
