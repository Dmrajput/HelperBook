import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AttendanceDateSelector from "../../components/attendance/AttendanceDateSelector";
import AttendanceStatusSelector from "../../components/attendance/AttendanceStatusSelector";
import BulkEmployeeSelector from "../../components/attendance/BulkEmployeeSelector";
import AttendanceEmptyState from "../../components/attendance/AttendanceEmptyState";
import { useMainTab } from "../../navigation/mainTabContext";
import { colors, spacing } from "../../theme";
import { bulkMarkAttendance, getAttendanceByDate } from "../../services/attendanceService";
import { todayKey } from "../../utils/attendanceFormat";

function ViewTabs({ navigation, openDaily }) {
  const tabs = [
    { id: "daily", label: "Daily", icon: "sunny", onPress: openDaily },
    { id: "bulk", label: "Bulk", icon: "people-outline", active: true },
    { id: "monthly", label: "Monthly", icon: "calendar-outline", onPress: () => navigation.navigate("MonthlyAttendance") },
    {
      id: "history",
      label: "History",
      icon: "time-outline",
      onPress: () => navigation.navigate("AttendanceHistory"),
    },
  ];

  return (
    <View style={styles.tabTrack}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: Boolean(tab.active) }}
          disabled={Boolean(tab.active)}
          onPress={tab.onPress}
          style={({ pressed }) => [styles.tab, tab.active && styles.tabActive, pressed && !tab.active && styles.pressed]}
        >
          <Ionicons name={tab.icon} size={15} color={tab.active ? colors.primary : colors.textSecondary} />
          <AppText
            variant="caption"
            color={tab.active ? colors.primary : colors.textSecondary}
            style={styles.tabLabel}
            numberOfLines={1}
          >
            {tab.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export default function BulkAttendanceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { setTab } = useMainTab();
  const [date, setDate] = useState(route.params?.date || todayKey());

  function openDaily() {
    setTab("Attendance");
    navigation.navigate("Home");
  }
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
      const active = data.employees.filter(
        (employee) => employee.employeeStatus === "active" && date >= employee.joiningDate
      );
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
        setSaveError(
          result.errors.map((item) => item.message).join("\n") || "Attendance could not be saved. Please try again."
        );
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

  const canSave = !saving && selected.size > 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Bulk attendance
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Mark several people at once
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select all employees"
            onPress={selectAll}
            style={styles.headerAction}
          >
            <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AttendanceDateSelector date={date} onChange={setDate} />
          <ViewTabs navigation={navigation} openDaily={openDaily} />

          <View style={styles.sectionCard}>
            <AppText variant="label" style={styles.sectionTitle}>
              Status
            </AppText>
            <AttendanceStatusSelector value={status} onChange={setStatus} />
            <AppTextInput label="Reason / Note" value={notes} onChangeText={setNotes} maxLength={500} />
          </View>

          {loading ? (
            <View style={styles.skeleton} accessibilityLabel="Loading attendance">
              <View style={styles.block} />
              <View style={styles.block} />
            </View>
          ) : null}
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
              <View style={styles.sectionHeader}>
                <AppText variant="label" style={styles.sectionTitle}>
                  Employees
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {`${selected.size} selected`}
                </AppText>
              </View>
              <View style={styles.selectionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select all"
                  onPress={selectAll}
                  style={({ pressed }) => [styles.selectionBtn, pressed && styles.pressed]}
                >
                  <AppText variant="caption" color={colors.primary} style={styles.selectionText}>
                    Select all
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Deselect all"
                  onPress={() => setSelected(new Set())}
                  style={({ pressed }) => [styles.selectionBtn, pressed && styles.pressed]}
                >
                  <AppText variant="caption" color={colors.textSecondary} style={styles.selectionText}>
                    Deselect all
                  </AppText>
                </Pressable>
              </View>
              <BulkEmployeeSelector employees={employees} selectedIds={selected} onToggle={toggle} />
            </>
          ) : null}
          <FieldError message={saveError} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.footerMeta}>
            <AppText variant="label">{`${selected.size} selected`}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Apply one status to the group
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save attendance"
            accessibilityState={{ disabled: !canSave, busy: saving }}
            disabled={!canSave}
            onPress={confirmSave}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave && styles.saveDisabled,
              pressed && canSave && styles.pressed,
            ]}
          >
            <Ionicons name="save-outline" size={18} color={canSave ? colors.textInverse : colors.disabledText} />
            <AppText variant="label" color={canSave ? colors.textInverse : colors.disabledText}>
              {saving ? "Saving..." : "Save"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
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
    fontWeight: "800",
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tabTrack: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tabLabel: {
    fontWeight: "700",
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  selectionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  selectionBtn: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectionText: {
    fontWeight: "700",
  },
  skeleton: { gap: spacing.md },
  block: {
    height: 72,
    borderRadius: 16,
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
  saveButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },
  saveDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
