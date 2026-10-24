import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
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
      <Ionicons name={icon} size={14} color={color} />
      <AppText variant="heading" style={[styles.statValue, { color }]} numberOfLines={1}>
        {String(value ?? 0)}
      </AppText>
      <AppText
        variant="caption"
        color={colors.textSecondary}
        numberOfLines={2}
        align="center"
        style={styles.statLabel}
      >
        {label}
      </AppText>
    </View>
  );
}

function SectionCard({ title, actionLabel, onAction, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <AppText variant="label" style={styles.sectionTitle} numberOfLines={1}>
          {title}
        </AppText>
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

function LinkRow({ label, subtitle, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.linkRow}>
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

function ActionButton({
  label,
  icon,
  onPress,
  disabled = false,
  filled = false,
  tone = "primary",
  style,
}) {
  const isDanger = tone === "danger";
  const iconColor = disabled
    ? colors.disabledText
    : filled
      ? colors.textInverse
      : isDanger
        ? colors.error
        : colors.primary;
  const textColor = iconColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        filled && !isDanger && styles.actionButtonFilled,
        filled && isDanger && styles.actionButtonDangerFilled,
        !filled && isDanger && styles.actionButtonDangerOutline,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabledChip,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={iconColor} /> : null}
      <AppText variant="label" color={textColor} style={styles.actionButtonLabel} numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function EmployeeProfileScreen({ navigation, route }) {
  const { employeeId } = route.params;
  const { width } = useWindowDimensions();
  const stackLeaveActions = width < 390;
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
                  <AppText variant="subtitle" style={styles.heroName} numberOfLines={2}>
                    {employee.name}
                  </AppText>
                  <StatusBadge status={employee.status} />
                </View>
                <AppText variant="body" color={colors.textSecondary} numberOfLines={2}>
                  {roleLabel(employee)}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit employee"
                onPress={() => navigation.navigate("EditEmployee", { employeeId: employee.id })}
                style={styles.editChip}
                hitSlop={8}
              >
                <Ionicons name="create-outline" size={14} color={colors.primary} />
                <AppText variant="caption" color={colors.primary} style={styles.editChipText}>
                  Edit
                </AppText>
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.metaText}>
                {employee.phone ? `Phone : ${formatPhone(employee.phone)}` : "Phone not added"}
              </AppText>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={2} style={styles.metaText}>
                {formatJoiningDate(employee.joiningDate)
                  ? `Joining Date : ${formatJoiningDate(employee.joiningDate)}`
                  : joinedLabel(employee.joiningDate)}
              </AppText>
            </View>
          </View>
        </View>

        <SectionCard
          title="This Month Attendance"
          actionLabel="View All"
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
            onPress={() => navigation.navigate("EmployeeAttendance", { employeeId: employee.id })}
          />
        </SectionCard>

        <SectionCard title="Salary">
          <View style={styles.salaryRow}>
            <View style={styles.salaryCard}>
              <AppText variant="caption" color={colors.textSecondary}>
                {employee.salary?.type === "daily" ? "Daily Salary" : "Monthly Salary"}
              </AppText>
              <AppText variant="subtitle" style={styles.salaryAmount} numberOfLines={1}>
                {formatInr(employee.salary?.amount)}
              </AppText>
              <ToneBadge label="Active" tone="success" />
            </View>
            <Pressable
              style={styles.salaryCard}
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
                    <>
                      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                        {formatAttendanceDate(latestSalary.payment.paymentDate)}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                        {methodLabel(latestSalary.payment.paymentMethod)}
                      </AppText>
                    </>
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
            onPress={() => navigation.navigate("SalaryHistory", { employeeId: employee.id })}
          />
        </SectionCard>

        <SectionCard
          title="Leave"
          actionLabel="View All"
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
          <View style={[styles.actionRow, stackLeaveActions && styles.actionColumn]}>
            <ActionButton
              label="Leave History"
              icon="list-outline"
              style={stackLeaveActions ? styles.actionFull : styles.actionHalf}
              onPress={() => navigation.navigate("LeaveHistory", { employeeId: employee.id })}
            />
            <ActionButton
              label="New Leave Request"
              icon="add"
              filled
              disabled={employee.status !== "active"}
              style={stackLeaveActions ? styles.actionFull : styles.actionHalf}
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

        <SectionCard title="Advance / Khata">
          <View style={styles.advanceRow}>
            <View style={styles.advanceCopy}>
              <AppText variant="caption" color={colors.textSecondary}>
                Outstanding Balance
              </AppText>
              <AppText variant="heading" style={styles.advanceAmount}>
                {advanceLoading ? "..." : advance ? formatInr(outstanding) : "—"}
              </AppText>
              {!advanceLoading && advance ? (
                <ToneBadge label={outstanding > 0 ? "Balance due" : "All clear"} tone={outstanding > 0 ? "warning" : "success"} />
              ) : null}
            </View>
            <View style={styles.advanceActions}>
              <ActionButton
                label="View Khata"
                icon="document-text-outline"
                style={styles.actionFull}
                onPress={() => navigation.navigate("EmployeeAdvance", { employeeId: employee.id })}
              />
              <ActionButton
                label="Give Advance"
                icon="cash-outline"
                disabled={employee.status !== "active"}
                style={styles.actionFull}
                onPress={() => navigation.navigate("GiveAdvance", { employeeId: employee.id, employeeName: employee.name })}
              />
            </View>
          </View>
          {employee.status !== "active" ? (
            <AppText variant="caption" color={colors.textSecondary}>
              This employee is inactive. New advances cannot be given.
            </AppText>
          ) : null}
        </SectionCard>

        <SectionCard title="Login Access">
          <View style={styles.loginGrid}>
            <View style={styles.loginItem}>
              <AppText variant="caption" color={colors.textSecondary}>
                Phone Number
              </AppText>
              <AppText variant="label" numberOfLines={2} style={styles.loginValue}>
                {employee.phone ? formatPhone(employee.phone) : "Not added"}
              </AppText>
            </View>
            <View style={styles.loginItem}>
              <AppText variant="caption" color={colors.textSecondary}>
                Login Status
              </AppText>
              <ToneBadge
                label={employee.loginEnabled ? "Enabled" : "Disabled"}
                tone={employee.loginEnabled ? "success" : "danger"}
              />
            </View>
            <View style={styles.loginItemWide}>
              <AppText variant="caption" color={colors.textSecondary}>
                Last Login
              </AppText>
              <AppText variant="label" numberOfLines={2} style={styles.loginValue}>
                {employee.lastLoginAt
                  ? new Date(employee.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                  : "Not yet"}
              </AppText>
            </View>
          </View>
          {employee.loginEnabled ? (
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color={colors.info} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.infoBannerText}>
                Employee login is active. Temporary passwords must be changed on first login.
              </AppText>
            </View>
          ) : null}
          {employee.mustChangePassword ? (
            <ToneBadge label="Must change password" tone="warning" />
          ) : null}
          {!employee.phone ? (
            <AppText variant="caption" color={colors.textSecondary}>
              Add a phone number to enable login.
            </AppText>
          ) : (
            <View style={styles.actionColumn}>
              <ActionButton
                label={employee.loginEnabled ? "Disable Login" : "Enable Login"}
                icon={employee.loginEnabled ? "lock-closed-outline" : "lock-open-outline"}
                disabled={Boolean(busy)}
                style={styles.actionFull}
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
                <ActionButton
                  label="Reset Temporary Password"
                  icon="key-outline"
                  disabled={Boolean(busy)}
                  style={styles.actionFull}
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
            </View>
          )}
        </SectionCard>

        {employee.notes ? (
          <SectionCard title="Notes">
            <AppText variant="body">{employee.notes}</AppText>
          </SectionCard>
        ) : null}

        <FieldError message={error} />
      </ScrollView>

      <View style={styles.footer}>
        <ActionButton
          label={
            busy
              ? busy
              : employee.status === "active"
                ? "Deactivate Employee"
                : "Reactivate Employee"
          }
          icon={employee.status === "active" ? "person-remove-outline" : "refresh-outline"}
          tone={employee.status === "active" ? "danger" : "primary"}
          disabled={Boolean(busy)}
          style={styles.actionFull}
          onPress={confirmStatus}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: {
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
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
    gap: spacing.xs,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  heroNameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  heroName: {
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
    maxWidth: "100%",
  },
  editChip: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 32,
  },
  editChipText: {
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 28,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    fontWeight: "700",
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 76,
  },
  statValue: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
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
  salaryCard: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
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
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionColumn: {
    flexDirection: "column",
    gap: spacing.sm,
  },
  actionHalf: {
    flex: 1,
    minWidth: 0,
  },
  actionFull: {
    alignSelf: "stretch",
    width: "100%",
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionButtonFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonDangerOutline: {
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  actionButtonDangerFilled: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  actionButtonLabel: {
    flexShrink: 1,
    textAlign: "center",
    fontWeight: "600",
  },
  disabledChip: {
    borderColor: colors.disabled,
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
  loginGrid: {
    gap: spacing.sm,
  },
  loginItem: {
    gap: 4,
  },
  loginItemWide: {
    gap: 4,
  },
  loginValue: {
    flexShrink: 1,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.infoBackground,
    borderRadius: 10,
    padding: spacing.md,
  },
  infoBannerText: {
    flex: 1,
    minWidth: 0,
    lineHeight: 18,
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
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  advanceActions: {
    width: 128,
    flexShrink: 0,
    gap: spacing.sm,
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
