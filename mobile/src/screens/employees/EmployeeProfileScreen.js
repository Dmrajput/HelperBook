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
import { getEmployeeById, resetEmployeePassword, setEmployeeLogin, updateEmployeeStatus } from "../../services/employeeService";
import { formatAttendanceDate, monthStartKey, todayKey } from "../../utils/attendanceFormat";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";
import { formatJoiningDate, formatPhone, roleLabel } from "../../utils/employeeFormat";
import { showEmployeeLimitAlert } from "../../utils/employeeLimit";

function joinedLabel(joiningDate) {
  const formatted = formatJoiningDate(joiningDate);
  if (!formatted) return "Joined date unavailable";
  const joined = new Date(joiningDate);
  if (Number.isNaN(joined.getTime())) return `Joined ${formatted}`;
  const today = new Date();
  const start = new Date(joined.getFullYear(), joined.getMonth(), joined.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.max(0, Math.round((end - start) / 86400000));
  if (days === 0) return `Joined ${formatted} (today)`;
  if (days === 1) return `Joined ${formatted} (1 day ago)`;
  if (days < 30) return `Joined ${formatted} (${days} days ago)`;
  return `Joined ${formatted}`;
}

function ToneBadge({ label, tone = "neutral" }) {
  const tones = {
    success: { background: colors.successBackground, color: colors.success },
    warning: { background: colors.warningBackground, color: colors.warning },
    danger: { background: colors.errorBackground, color: colors.error },
    info: { background: colors.infoBackground, color: colors.info },
    neutral: { background: colors.disabled, color: colors.textSecondary },
  };
  const style = tones[tone] || tones.neutral;
  return (
    <View style={[styles.toneBadge, { backgroundColor: style.background }]}>
      <AppText variant="caption" color={style.color} style={styles.toneBadgeText}>
        {label}
      </AppText>
    </View>
  );
}

function StatTile({ label, value, icon, color, background }) {
  return (
    <View style={[styles.statTile, { backgroundColor: background }]}>
      <Ionicons name={icon} size={16} color={color} />
      <AppText variant="heading" style={[styles.statValue, { color }]}>
        {String(value ?? 0)}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} align="center">
        {label}
      </AppText>
    </View>
  );
}

function SectionCard({ title, icon, actionLabel, onAction, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIcon}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
          <AppText variant="label" style={styles.sectionTitle} numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} hitSlop={8}>
            <AppText variant="label" color={colors.primary}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function LinkRow({ label, subtitle, icon, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.linkRow}>
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.linkCopy}>
        <AppText variant="label" numberOfLines={1}>
          {label}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
    </Pressable>
  );
}

function ActionChip({ label, icon, onPress, disabled = false, filled = false }) {
  const iconColor = disabled ? colors.disabledText : filled ? colors.textInverse : colors.primary;
  const textColor = disabled ? colors.disabledText : filled ? colors.textInverse : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionChip,
        filled && styles.actionChipFilled,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabledChip,
      ]}
    >
      <Ionicons name={icon} size={16} color={iconColor} />
      <AppText variant="label" color={textColor} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

function FooterButton({ label, icon, onPress, disabled = false, tone = "primary" }) {
  const isDanger = tone === "danger";
  const color = disabled ? colors.disabledText : isDanger ? colors.error : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.footerButton,
        isDanger ? styles.footerDanger : styles.footerSecondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabledChip,
      ]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <AppText variant="label" color={color} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

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
    if (busy) return;
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
    if (!employee || busy) return;
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

  if (loading && !employee) {
    return (
      <AppScreen title="Employee" subtitle="Employee Profile">
        <AppText color={colors.textSecondary}>Loading employee...</AppText>
      </AppScreen>
    );
  }

  if (!employee) {
    return (
      <AppScreen title="Employee" subtitle="Employee Profile">
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
  const salaryTone = latestSalary
    ? latestSalary.status !== "finalized"
      ? "warning"
      : latestSalary.paymentStatus === "paid"
        ? "success"
        : "danger"
    : "neutral";
  const outstanding = Number(advance?.outstanding) || 0;
  const initial = String(employee.name || "A").trim().charAt(0).toUpperCase();

  return (
    <AppScreen title={employee.name} subtitle="Employee Profile">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <AppText variant="heading" color={colors.primary} style={styles.avatarLetter}>
                {initial}
              </AppText>
            </View>
            <View style={[styles.onlineDot, employee.status !== "active" && styles.offlineDot]} />
          </View>
          <View style={styles.heroCopy}>
            <View style={styles.heroTop}>
              <View style={styles.heroNameBlock}>
                <View style={styles.nameBadgeRow}>
                  <AppText variant="subtitle" style={styles.heroName} numberOfLines={1}>
                    {employee.name}
                  </AppText>
                  <StatusBadge status={employee.status} />
                </View>
                <AppText variant="body" color={colors.textSecondary}>
                  {roleLabel(employee)}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit employee"
                onPress={() => navigation.navigate("EditEmployee", { employeeId: employee.id })}
                style={styles.editChip}
              >
                <Ionicons name="create-outline" size={14} color={colors.primary} />
                <AppText variant="caption" color={colors.primary} style={styles.editChipText}>
                  Edit
                </AppText>
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {employee.phone ? formatPhone(employee.phone) : "Phone not added"}
              </AppText>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                {joinedLabel(employee.joiningDate)}
              </AppText>
            </View>
          </View>
        </View>

        <SectionCard
          title="This Month Attendance"
          icon="calendar-outline"
          actionLabel="View All ›"
          onAction={() => navigation.navigate("EmployeeAttendance", { employeeId: employee.id })}
        >
          <View style={styles.statRow}>
            <StatTile label="Present" value={attendance?.present ?? 0} icon="checkmark-circle" color={colors.success} background={colors.successBackground} />
            <StatTile label="Absent" value={attendance?.absent ?? 0} icon="close-circle" color={colors.error} background={colors.errorBackground} />
            <StatTile label="Half Day" value={attendance?.halfDay ?? 0} icon="time" color={colors.warning} background={colors.warningBackground} />
            <StatTile label="Leave" value={attendance?.leave ?? 0} icon="calendar" color={colors.info} background={colors.infoBackground} />
          </View>
          <LinkRow
            label="Attendance History"
            subtitle="View daily attendance records"
            icon="bar-chart-outline"
            onPress={() => navigation.navigate("EmployeeAttendance", { employeeId: employee.id })}
          />
        </SectionCard>

        <SectionCard title="Salary" icon="wallet-outline">
          <View style={styles.salaryRow}>
            <View style={styles.salaryCol}>
              <AppText variant="caption" color={colors.textSecondary}>
                Current Pay
              </AppText>
              <AppText variant="subtitle" style={styles.salaryAmount} numberOfLines={1}>
                {`${formatInr(employee.salary?.amount)}${employee.salary?.type === "daily" ? " / day" : " / month"}`}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {employee.salary?.type === "daily" ? "Daily salary" : "Monthly salary"}
              </AppText>
            </View>
            <View style={styles.salaryDivider} />
            <Pressable
              style={styles.salaryCol}
              disabled={!latestSalary}
              onPress={() => latestSalary && navigation.navigate("SalaryDetail", { salaryId: latestSalary.id })}
              accessibilityRole={latestSalary ? "button" : "text"}
              accessibilityLabel="Latest salary"
            >
              <AppText variant="caption" color={colors.textSecondary}>
                Latest Salary
              </AppText>
              {latestSalary ? (
                <>
                  <View style={styles.latestRow}>
                    <AppText variant="subtitle" style={styles.salaryAmount} numberOfLines={1}>
                      {formatInr(latestSalary.calculation?.netSalary)}
                    </AppText>
                    <Ionicons name="chevron-forward" size={14} color={colors.placeholder} />
                  </View>
                  <ToneBadge label={salaryLabel} tone={salaryTone} />
                  {latestSalary.paymentStatus === "paid" && latestSalary.payment?.paymentDate ? (
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {`${formatAttendanceDate(latestSalary.payment.paymentDate)} · ${methodLabel(latestSalary.payment.paymentMethod)}`}
                    </AppText>
                  ) : null}
                </>
              ) : (
                <AppText variant="caption" color={colors.textSecondary}>
                  No salary records yet
                </AppText>
              )}
            </Pressable>
          </View>
          <LinkRow
            label="Salary History"
            subtitle="View all past salary payments"
            icon="download-outline"
            onPress={() => navigation.navigate("SalaryHistory", { employeeId: employee.id })}
          />
        </SectionCard>

        <SectionCard
          title="Leave"
          icon="calendar-outline"
          actionLabel="View All ›"
          onAction={() => navigation.navigate("LeaveHistory", { employeeId: employee.id })}
        >
          {leaveLoading ? (
            <AppText variant="caption" color={colors.textSecondary}>
              Loading leave...
            </AppText>
          ) : leaveSummary ? (
            <View style={styles.statRow}>
              <StatTile label="Paid Leave" value={leaveSummary.paidDays ?? 0} icon="checkmark-circle" color={colors.success} background={colors.successBackground} />
              <StatTile label="Unpaid Leave" value={leaveSummary.unpaidDays ?? 0} icon="close-circle" color={colors.error} background={colors.errorBackground} />
              <StatTile label="Sick Leave" value={leaveSummary.sickDays ?? 0} icon="medkit" color={colors.warning} background={colors.warningBackground} />
              <StatTile label="Pending" value={leaveSummary.pending ?? 0} icon="time" color={colors.info} background={colors.infoBackground} />
            </View>
          ) : (
            <AppText variant="caption" color={colors.textSecondary}>
              Leave information is unavailable.
            </AppText>
          )}
          <View style={styles.chipRow}>
            <ActionChip
              label="Leave History"
              icon="list-outline"
              onPress={() => navigation.navigate("LeaveHistory", { employeeId: employee.id })}
            />
            <ActionChip
              label="New Leave Request"
              icon="add"
              filled
              disabled={employee.status !== "active"}
              onPress={() =>
                navigation.navigate("CreateLeave", {
                  mode: "request",
                  employeeId: employee.id,
                  employeeName: employee.name,
                })
              }
            />
          </View>
        </SectionCard>

        <SectionCard title="Advance / Khata" icon="cash-outline">
          <View style={styles.advanceRow}>
            <View style={styles.advanceCopy}>
              <AppText variant="caption" color={colors.textSecondary}>
                Outstanding
              </AppText>
              <AppText variant="heading" style={styles.advanceAmount}>
                {advanceLoading ? "..." : advance ? formatInr(outstanding) : "—"}
              </AppText>
              {!advanceLoading && advance ? (
                <ToneBadge label={outstanding > 0 ? "Balance due" : "All clear"} tone={outstanding > 0 ? "warning" : "success"} />
              ) : null}
            </View>
            <View style={styles.advanceActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View Khata"
                onPress={() => navigation.navigate("EmployeeAdvance", { employeeId: employee.id })}
                style={({ pressed }) => [styles.stackChip, pressed && styles.pressed]}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <AppText variant="label" color={colors.primary} numberOfLines={1}>
                  View Khata
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Give Advance"
                accessibilityState={{ disabled: employee.status !== "active" }}
                disabled={employee.status !== "active"}
                onPress={() => navigation.navigate("GiveAdvance", { employeeId: employee.id, employeeName: employee.name })}
                style={({ pressed }) => [
                  styles.stackChip,
                  pressed && employee.status === "active" && styles.pressed,
                  employee.status !== "active" && styles.disabledChip,
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={employee.status !== "active" ? colors.disabledText : colors.primary}
                />
                <AppText
                  variant="label"
                  color={employee.status !== "active" ? colors.disabledText : colors.primary}
                  numberOfLines={1}
                >
                  Give Advance
                </AppText>
              </Pressable>
            </View>
          </View>
          {employee.status !== "active" ? (
            <AppText variant="caption" color={colors.textSecondary}>
              This employee is inactive. New advances cannot be given.
            </AppText>
          ) : null}
        </SectionCard>

        <SectionCard title="Login Access" icon="lock-closed-outline">
          <View style={styles.loginRow}>
            <View style={styles.loginCol}>
              <AppText variant="caption" color={colors.textSecondary}>
                Phone Number
              </AppText>
              <View style={styles.loginValueRow}>
                <Ionicons name="call-outline" size={13} color={colors.textSecondary} />
                <AppText variant="label" numberOfLines={1} style={styles.loginValue}>
                  {employee.phone ? formatPhone(employee.phone) : "Not added"}
                </AppText>
              </View>
            </View>
            <View style={styles.loginCol}>
              <AppText variant="caption" color={colors.textSecondary}>
                Login Status
              </AppText>
              <ToneBadge
                label={employee.loginEnabled ? "Enabled" : "Disabled"}
                tone={employee.loginEnabled ? "success" : "danger"}
              />
            </View>
            <View style={styles.loginCol}>
              <AppText variant="caption" color={colors.textSecondary}>
                Last Login
              </AppText>
              <View style={styles.loginValueRow}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <AppText variant="caption" numberOfLines={2} style={styles.loginValue}>
                  {employee.lastLoginAt
                    ? new Date(employee.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                    : "Not yet"}
                </AppText>
              </View>
            </View>
          </View>
          {employee.loginEnabled ? (
            <AppText variant="caption" color={colors.textSecondary}>
              They sign in from Employee Login. Temporary passwords must be changed on first login.
            </AppText>
          ) : null}
          {employee.mustChangePassword ? (
            <ToneBadge label="Must change password" tone="warning" />
          ) : null}
          {!employee.phone ? (
            <AppText variant="caption" color={colors.textSecondary}>
              Add a phone number to enable login.
            </AppText>
          ) : (
            <>
              <AppButton
                label={employee.loginEnabled ? "Disable Login for Employee" : "Enable Login for Employee"}
                variant="secondary"
                disabled={Boolean(busy)}
                onPress={async () => {
                  setBusy(employee.loginEnabled ? "Disabling login..." : "Enabling login...");
                  try {
                    const result = await setEmployeeLogin(employee.id, !employee.loginEnabled);
                    setEmployee((current) =>
                      current
                        ? {
                            ...current,
                            loginEnabled: result.loginEnabled,
                            mustChangePassword: Boolean(result.mustChangePassword),
                          }
                        : current
                    );
                    if (result.temporaryPassword) {
                      navigation.navigate("EmployeeCredentials", {
                        employeeId: employee.id,
                        name: employee.name,
                        phone: employee.phone,
                        temporaryPassword: result.temporaryPassword,
                      });
                    }
                  } catch (loginError) {
                    Alert.alert("Employee Login", loginError?.message || "Unable to update employee login.");
                  } finally {
                    setBusy("");
                  }
                }}
              />
              {employee.loginEnabled ? (
                <AppButton
                  label="Reset Temporary Password"
                  variant="secondary"
                  disabled={Boolean(busy)}
                  onPress={() => {
                    Alert.alert(
                      "Reset password?",
                      "A new temporary password will be generated. The employee must change it on next login.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Reset",
                          onPress: async () => {
                            setBusy("Resetting password...");
                            try {
                              const result = await resetEmployeePassword(employee.id);
                              setEmployee((current) =>
                                current
                                  ? {
                                      ...current,
                                      loginEnabled: true,
                                      mustChangePassword: true,
                                    }
                                  : current
                              );
                              navigation.navigate("EmployeeCredentials", {
                                employeeId: employee.id,
                                name: employee.name,
                                phone: employee.phone,
                                temporaryPassword: result.temporaryPassword,
                              });
                            } catch (resetError) {
                              Alert.alert("Reset password", resetError?.message || "Unable to reset password.");
                            } finally {
                              setBusy("");
                            }
                          },
                        },
                      ]
                    );
                  }}
                />
              ) : null}
            </>
          )}
        </SectionCard>

        {employee.notes ? (
          <SectionCard title="Notes" icon="document-text-outline">
            <AppText variant="body">{employee.notes}</AppText>
          </SectionCard>
        ) : null}

        <FieldError message={error} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit Employee"
          accessibilityState={{ disabled: Boolean(busy) }}
          disabled={Boolean(busy)}
          onPress={() => navigation.navigate("EditEmployee", { employeeId: employee.id })}
          style={({ pressed }) => [styles.editEmployeeBtn, pressed && !busy && styles.pressed, busy && styles.disabledChip]}
        >
          <Ionicons name="create-outline" size={18} color={busy ? colors.disabledText : colors.textInverse} />
          <AppText variant="button" color={busy ? colors.disabledText : colors.textInverse}>
            Edit Employee
          </AppText>
        </Pressable>
        <FooterButton
          label={
            busy
              ? busy
              : employee.status === "active"
                ? "Deactivate Employee"
                : "Reactivate Employee"
          }
          icon={employee.status === "active" ? "person-remove-outline" : "refresh-outline"}
          tone={employee.status === "active" ? "danger" : "primary"}
          onPress={confirmStatus}
          disabled={Boolean(busy)}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarWrap: {
    width: 64,
    height: 64,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  offlineDot: {
    backgroundColor: colors.placeholder,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  heroNameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  heroName: {
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 32,
  },
  editChipText: {
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 32,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontWeight: "700",
  },
  statRow: {
    flexDirection: "row",
    gap: 6,
  },
  statTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 2,
    minHeight: 78,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  linkCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  salaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  salaryCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  salaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  salaryAmount: {
    fontWeight: "700",
  },
  latestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toneBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  toneBadgeText: {
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  actionChipFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabledChip: {
    borderColor: colors.disabled,
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
  loginValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loginValue: {
    flex: 1,
    minWidth: 0,
  },
  editEmployeeBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  footerSecondary: {
    borderColor: colors.primary,
  },
  footerDanger: {
    borderColor: colors.error,
  },
  advanceRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  advanceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  advanceAmount: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  },
  advanceActions: {
    width: 132,
    gap: spacing.sm,
  },
  stackChip: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  loginRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  loginCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
