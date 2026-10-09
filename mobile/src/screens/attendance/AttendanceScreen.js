import { useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AttendanceDateSelector from "../../components/attendance/AttendanceDateSelector";
import AttendanceEmployeeCard from "../../components/attendance/AttendanceEmployeeCard";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import AttendanceSummary from "../../components/attendance/AttendanceSummary";
import { useDailyAttendance } from "../../hooks/useAttendance";
import { colors, spacing } from "../../theme";
import { bulkMarkAttendance } from "../../services/attendanceService";
import { formatAttendanceDate, statusLabel, todayKey } from "../../utils/attendanceFormat";

const PAGE_BG = "#F4F7F5";
const HEADER = "#0F6B4F";

function weekdayLabel(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function AttendanceSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading attendance">
      <View style={styles.skeletonSummary} />
      <View style={styles.skeletonRow} />
      <View style={styles.skeletonRow} />
      <View style={styles.skeletonRow} />
    </View>
  );
}

export default function AttendanceScreen({ embedded = false }) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
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
  const pending = changes();
  const isToday = date === todayKey();
  const links = [
    { label: "Bulk", hint: "Mark several people", icon: "checkmark-done-outline", onPress: () => navigation.navigate("BulkAttendance", { date }) },
    { label: "Month", hint: "Calendar view", icon: "calendar-outline", onPress: () => navigation.navigate("MonthlyAttendance") },
    { label: "History", hint: "Past records", icon: "time-outline", onPress: () => navigation.navigate("AttendanceHistory") },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          {embedded ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => navigation.goBack()}
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
            </Pressable>
          )}
          <View style={styles.headerCopy}>
            <AppText variant="heading" color={colors.textInverse} accessibilityRole="header" style={styles.title}>
              Attendance
            </AppText>
            <AppText variant="caption" color="#E7F6EF" numberOfLines={1}>
              {isToday ? `Today · ${weekdayLabel(date)}` : weekdayLabel(date)}
            </AppText>
          </View>
          <View style={styles.mark} accessibilityElementsHidden>
            <Ionicons name="calendar" size={24} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => load({ refresh: true })} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <AttendanceDateSelector date={date} onChange={setDate} />
          <View style={styles.links}>
            {links.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={item.hint}
                onPress={item.onPress}
                style={({ pressed }) => [styles.link, pressed && styles.pressed]}
              >
                <View style={styles.linkIcon}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} />
                </View>
                <AppText variant="label" numberOfLines={1}>{item.label}</AppText>
              </Pressable>
            ))}
          </View>
          {isLoading && !data ? <AttendanceSkeleton /> : null}
          {loadError && !data ? (
            <ErrorView title="Unable to load attendance." message={loadError} onRetry={() => load()} />
          ) : null}
          {data?.shopClosed ? (
            <View style={styles.banner}>
              <Ionicons name="moon-outline" size={18} color="#9A5B12" />
              <View style={styles.bannerCopy}>
                <AppText variant="label" color="#9A5B12">Weekly off</AppText>
                <AppText variant="caption" color="#9A5B12">
                  The shop is normally closed today. You can still mark attendance.
                </AppText>
              </View>
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
        </View>
      </ScrollView>

      {data?.employees?.length ? (
        <View style={[styles.footer, { paddingBottom: embedded ? spacing.md : Math.max(insets.bottom, spacing.md) }]}>
          <AppText variant="caption" color={colors.textSecondary} align="center">
            {pending.length
              ? `${pending.length} change${pending.length === 1 ? "" : "s"} to save`
              : "Attendance is up to date"}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all present"
            disabled={saving}
            onPress={markAllPresent}
            style={styles.markAll}
          >
            <AppText variant="label" color={colors.primary} align="center">
              Mark all present
            </AppText>
          </Pressable>
          <AppButton
            label={saving ? "Saving..." : "Save Attendance"}
            onPress={confirmSave}
            disabled={saving || pending.length === 0}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    backgroundColor: HEADER,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
    fontSize: 26,
    lineHeight: 32,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F7F3EA",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: spacing.lg,
  },
  body: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  links: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  link: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  linkIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.88,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#FFF4E8",
    borderRadius: 16,
    padding: spacing.md,
  },
  bannerCopy: {
    flex: 1,
    gap: 2,
  },
  skeleton: {
    gap: spacing.sm,
  },
  skeletonSummary: {
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.disabled,
  },
  skeletonRow: {
    height: 108,
    borderRadius: 18,
    backgroundColor: colors.disabled,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: PAGE_BG,
  },
  markAll: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
