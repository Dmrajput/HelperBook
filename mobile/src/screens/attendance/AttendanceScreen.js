import { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
import AttendanceDateSelector from "../../components/attendance/AttendanceDateSelector";
import AttendanceEmployeeCard from "../../components/attendance/AttendanceEmployeeCard";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import AttendanceSummary from "../../components/attendance/AttendanceSummary";
import { useDailyAttendance } from "../../hooks/useAttendance";
import { colors, spacing } from "../../theme";
import { bulkMarkAttendance } from "../../services/attendanceService";
import { formatAttendanceDate, statusLabel, todayKey } from "../../utils/attendanceFormat";

export default function AttendanceScreen({ embedded = false }) {
  const navigation = useNavigation();
  const route = useRoute();
  const routeDate = route.name === "AttendanceDay" ? route.params?.date : "";
  const [date, setDate] = useState(routeDate || todayKey());
  const { data, isLoading, isRefreshing, error, load } = useDailyAttendance(date);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (routeDate) {
      setDate(routeDate);
    }
  }, [routeDate]);

  useEffect(() => {
    if (!data?.employees) {
      return;
    }
    setDrafts(
      Object.fromEntries(
        data.employees.map((employee) => [
          employee.employeeId,
          { status: employee.status, notes: employee.notes || "" },
        ])
      )
    );
  }, [data]);

  function updateDraft(employeeId, next) {
    setDrafts((current) => ({ ...current, [employeeId]: next }));
    setSaveError("");
  }

  function markAllPresent() {
    if (!data?.employees) {
      return;
    }
    setDrafts((current) => {
      const next = { ...current };
      for (const employee of data.employees) {
        if (employee.employeeStatus !== "active" || date < employee.joiningDate || employee.leaveSource === "leave") {
          continue;
        }
        next[employee.employeeId] = { status: "present", notes: current[employee.employeeId]?.notes || "" };
      }
      return next;
    });
  }

  function changes() {
    if (!data?.employees) {
      return [];
    }
    return data.employees.flatMap((employee) => {
      const draft = drafts[employee.employeeId];
      if (!draft?.status) {
        return [];
      }
      const notes = draft.notes || "";
      if (draft.status === employee.status && notes === (employee.notes || "")) {
        return [];
      }
      return [{ ...employee, nextStatus: draft.status, nextNotes: notes }];
    });
  }

  async function save(rows, overwriteExisting) {
    setSaving(true);
    setSaveError("");
    try {
      const result = await bulkMarkAttendance({
        date,
        overwriteExisting,
        records: rows.map((row) => ({
          employeeId: row.employeeId,
          status: row.nextStatus,
          notes: row.nextNotes,
        })),
      });
      if (result.failed > 0) {
        setSaveError(result.errors.map((item) => item.message).filter(Boolean).join("\n") || "Attendance could not be saved. Please try again.");
        if (result.created || result.updated) {
          await load({ refresh: true });
        }
        return;
      }
      await load({ refresh: true });
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
    const rows = changes();
    if (!rows.length || saving) {
      return;
    }
    const overwrites = rows.filter((row) => row.attendanceId);
    const run = () => save(rows, overwrites.length > 0);
    if (overwrites.length === 1) {
      const row = overwrites[0];
      Alert.alert(
        "Change attendance?",
        `${row.name}\n${formatAttendanceDate(date)}\n\n${statusLabel(row.status)} → ${statusLabel(row.nextStatus)}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: run },
        ]
      );
      return;
    }
    if (overwrites.length > 1) {
      Alert.alert(
        "Some employees already have attendance marked for this date.",
        "Do you want to update their existing attendance?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Update", onPress: run },
        ]
      );
      return;
    }
    run();
  }

  const loadError = error
    ? error.isNetworkError
      ? "Unable to load attendance. Please check your internet connection and try again."
      : error.message || "Unable to load attendance."
    : "";

  return (
    <ScreenContainer edges={embedded ? ["top", "left", "right"] : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load({ refresh: true })} />}
      >
        <AppText variant="heading" accessibilityRole="header">
          Attendance
        </AppText>
        <AttendanceDateSelector date={date} onChange={setDate} />
        <View style={styles.links}>
          <AppButton label="Bulk Attendance" variant="secondary" onPress={() => navigation.navigate("BulkAttendance", { date })} />
          <AppButton label="Monthly" variant="secondary" onPress={() => navigation.navigate("MonthlyAttendance")} />
          <AppButton label="History" variant="secondary" onPress={() => navigation.navigate("AttendanceHistory")} />
        </View>
        {isLoading && !data ? <AppText color={colors.textSecondary}>Loading attendance...</AppText> : null}
        {loadError && !data ? <ErrorView title="Unable to load attendance." message={loadError} onRetry={() => load()} /> : null}
        {data?.shopClosed ? (
          <View style={styles.banner}>
            <AppText variant="label">Weekly Off</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              The shop is normally closed today.
            </AppText>
          </View>
        ) : null}
        {data ? <AttendanceSummary summary={data.summary} /> : null}
        {data && data.employees.length === 0 ? (
          <AttendanceEmptyState
            title="No active employees"
            message="Add employees before marking attendance."
            actionLabel="Add Employee"
            onAction={() => navigation.navigate("AddEmployee")}
          />
        ) : null}
        {data?.employees.map((employee) => (
          <AttendanceEmployeeCard
            key={employee.employeeId}
            employee={employee}
            date={date}
            value={drafts[employee.employeeId]?.status || null}
            notes={drafts[employee.employeeId]?.notes || ""}
            disabled={saving}
            onChange={(next) => updateDraft(employee.employeeId, next)}
          />
        ))}
        <FieldError message={saveError} />
      </ScrollView>
      <View style={styles.footer}>
        {data?.employees?.length ? (
          <>
            <AppButton label="Mark All Present" variant="secondary" onPress={markAllPresent} disabled={saving} />
            <AppButton
              label={saving ? "Saving..." : "Save Attendance"}
              onPress={confirmSave}
              disabled={saving || changes().length === 0}
            />
          </>
        ) : null}
        {embedded ? null : <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  links: {
    gap: spacing.sm,
  },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
});
