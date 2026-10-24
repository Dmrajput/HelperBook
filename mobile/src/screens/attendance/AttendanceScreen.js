import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function draftSummary(employees, drafts) {
  const counts = {
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    total: employees.length,
    notMarked: 0,
  };
  for (const employee of employees) {
    const status = drafts[employee.employeeId]?.status;
    if (!status) {
      counts.notMarked += 1;
    } else if (status === "present") {
      counts.present += 1;
    } else if (status === "absent") {
      counts.absent += 1;
    } else if (status === "half_day") {
      counts.halfDay += 1;
    } else if (status === "leave") {
      counts.leave += 1;
    } else {
      counts.notMarked += 1;
    }
  }
  return counts;
}

function AttendanceSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading attendance">
      <View style={styles.skeletonSummary} />
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
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (routeDate) {
      setDate(routeDate);
    }
  }, [routeDate]);

  const employeeIdsKey = useMemo(
    () => (data?.employees || []).map((employee) => employee.employeeId).join(","),
    [data?.employees]
  );

  useEffect(() => {
    if (!data?.employees || data.date !== date) {
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
    // Depend on date + employee id set only — avoid wiping in-progress edits on refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally ignore data object identity
  }, [date, employeeIdsKey, data?.date]);

  const updateDraft = useCallback((employeeId, next) => {
    setDrafts((current) => ({ ...current, [employeeId]: next }));
    setSaveError("");
  }, []);

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
        setSaveError(
          result.errors.map((item) => item.message).filter(Boolean).join("\n") ||
            "Attendance could not be saved. Please try again."
        );
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
  const employees = data?.employees || [];
  const summary = useMemo(() => draftSummary(employees, drafts), [employees, drafts]);
  const markedCount = summary.total - summary.notMarked;
  const filteredEmployees = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return employees;
    }
    return employees.filter((employee) => String(employee.name || "").toLowerCase().includes(needle));
  }, [employees, query]);

  const viewTabs = [
    { id: "daily", label: "Daily", icon: "sunny", active: true, onPress: null },
    {
      id: "bulk",
      label: "Bulk",
      icon: "people-outline",
      onPress: () => navigation.navigate("BulkAttendance", { date }),
    },
    {
      id: "monthly",
      label: "Monthly",
      icon: "calendar-outline",
      onPress: () => navigation.navigate("MonthlyAttendance"),
    },
    {
      id: "history",
      label: "History",
      icon: "time-outline",
      onPress: () => navigation.navigate("AttendanceHistory"),
    },
  ];

  const renderEmployee = useCallback(
    ({ item: employee }) => (
      <AttendanceEmployeeCard
        employee={employee}
        date={date}
        value={drafts[employee.employeeId]?.status || null}
        notes={drafts[employee.employeeId]?.notes || ""}
        disabled={saving}
        onChange={(next) => updateDraft(employee.employeeId, next)}
      />
    ),
    [date, drafts, saving, updateDraft]
  );

  const listHeader = (
    <View style={styles.body}>
      <AttendanceDateSelector date={date} onChange={setDate} />

      <View style={styles.tabs}>
        {viewTabs.map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: Boolean(tab.active) }}
            disabled={Boolean(tab.active)}
            onPress={tab.onPress || undefined}
            style={({ pressed }) => [
              styles.tab,
              tab.active ? styles.tabActive : styles.tabIdle,
              pressed && !tab.active && styles.pressed,
            ]}
          >
            <Ionicons name={tab.icon} size={16} color={tab.active ? colors.textInverse : colors.primary} />
            <AppText
              variant="caption"
              color={tab.active ? colors.textInverse : colors.primary}
              style={styles.tabLabel}
              numberOfLines={1}
            >
              {tab.label}
            </AppText>
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
            <AppText variant="label" color="#9A5B12">
              Weekly off
            </AppText>
            <AppText variant="caption" color="#9A5B12">
              The shop is normally closed today. You can still mark attendance.
            </AppText>
          </View>
        </View>
      ) : null}

      {data ? <AttendanceSummary summary={summary} /> : null}

      {data && employees.length > 0 ? (
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Ionicons name="search" size={18} color={colors.placeholder} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search employees"
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              accessibilityLabel="Search employees"
            />
            {query ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.placeholder} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            onPress={() => navigation.navigate("BulkAttendance", { date })}
            style={styles.filterButton}
          >
            <Ionicons name="options-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}

      {data && employees.length > 0 ? (
        <View style={styles.listHeader}>
          <AppText variant="label">{`Employees (${filteredEmployees.length})`}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all present"
            disabled={saving}
            onPress={markAllPresent}
            style={styles.markAll}
          >
            <Ionicons name="checkmark-done" size={16} color={colors.primary} />
            <AppText variant="caption" color={colors.primary} style={styles.markAllText}>
              Mark all present
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {data && employees.length === 0 ? (
        <AttendanceEmptyState
          title="No active employees"
          message="Add employees before marking attendance."
          actionLabel="Add Employee"
          onAction={() => navigation.navigate("AddEmployee")}
        />
      ) : null}

      {data && employees.length > 0 && filteredEmployees.length === 0 ? (
        <View style={styles.emptySearch}>
          <AppText variant="body" color={colors.textSecondary} align="center">
            No employees match “{query.trim()}”.
          </AppText>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#818CF8", "#6366F1", "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
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
            <AppText variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={1}>
              Mark your team's attendance.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Monthly calendar"
            onPress={() => navigation.navigate("MonthlyAttendance")}
            style={styles.headerAction}
          >
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.employeeId}
        renderItem={renderEmployee}
        ListHeaderComponent={listHeader}
        ListFooterComponent={<FieldError message={saveError} />}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => load({ refresh: true })} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
      />

      {data?.employees?.length ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: embedded ? spacing.md : Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.footerMeta}>
            <AppText variant="label" color={colors.text}>
              {`${markedCount} of ${summary.total} marked`}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {pending.length
                ? `${pending.length} change${pending.length === 1 ? "" : "s"} to save`
                : "Attendance is up to date"}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save attendance"
            accessibilityState={{ disabled: saving || pending.length === 0 }}
            disabled={saving || pending.length === 0}
            onPress={confirmSave}
            style={({ pressed }) => [
              styles.savePressable,
              (saving || pending.length === 0) && styles.saveDisabled,
              pressed && pending.length > 0 && !saving && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={
                saving || pending.length === 0
                  ? [colors.disabled, colors.disabled]
                  : ["#818CF8", "#6366F1", "#4F46E5"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Ionicons
                name="save-outline"
                size={18}
                color={saving || pending.length === 0 ? colors.disabledText : colors.textInverse}
              />
              <AppText
                variant="button"
                color={saving || pending.length === 0 ? colors.disabledText : colors.textInverse}
              >
                {saving ? "Saving..." : "Save Attendance"}
              </AppText>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
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
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
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
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabLabel: {
    fontWeight: "700",
    fontSize: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchField: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: colors.text,
    fontSize: 15,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  markAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 32,
  },
  markAllText: {
    fontWeight: "700",
  },
  emptySearch: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
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
    height: 88,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  skeletonRow: {
    height: 148,
    borderRadius: 20,
    backgroundColor: colors.disabled,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  savePressable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  saveDisabled: {
    opacity: 1,
  },
});
