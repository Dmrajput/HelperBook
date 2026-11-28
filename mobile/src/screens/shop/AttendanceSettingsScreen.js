import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import { getMyShop, updateAttendanceSettings } from "../../services/shopService";
import { colors, spacing } from "../../theme";

function Choice({ selected, icon, title, description, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.choiceCopy}>
        <AppText variant="label" style={styles.choiceTitle}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {description}
        </AppText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export default function AttendanceSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [autoMarkPresent, setAutoMarkPresent] = useState(false);
  const [employeesCanMark, setEmployeesCanMark] = useState(false);
  const [activeCount, setActiveCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyShop()
        .then((shop) => {
          if (!active) return;
          const settings = shop?.settings?.attendanceSettings || {};
          setAutoMarkPresent(settings.autoMarkPresent === true);
          setEmployeesCanMark(settings.employeesCanMarkAttendance === true);
          setActiveCount(Number.isInteger(settings.activeEmployeeCount) ? settings.activeEmployeeCount : null);
        })
        .catch((loadError) => {
          if (active) setError(loadError.message);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  async function save() {
    setLoading(true);
    setError("");
    setSaved("");
    try {
      const shop = await updateAttendanceSettings({
        autoMarkPresent,
        employeesCanMarkAttendance: employeesCanMark,
      });
      const settings = shop?.settings?.attendanceSettings || {};
      setAutoMarkPresent(settings.autoMarkPresent === true);
      setEmployeesCanMark(settings.employeesCanMarkAttendance === true);
      setSaved("Attendance settings saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save attendance settings.");
    } finally {
      setLoading(false);
    }
  }

  const smallTeam = activeCount !== null && activeCount <= 5;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Attendance
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Who marks the day
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <AppText variant="label" style={styles.infoTitle}>
              {smallTeam ? "A simple setup for a small team" : "Daily attendance"}
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {smallTeam
                ? `You have ${activeCount} active employee${activeCount === 1 ? "" : "s"}. Mark the usual day as present, then change only the people who are absent or on leave.`
                : "Choose a default for working days, then decide if employees can mark themselves from their login."}
            </AppText>
          </View>

          <AppText variant="label" style={styles.sectionLabel}>
            Default for a working day
          </AppText>
          <Choice
            selected={autoMarkPresent}
            icon="checkmark-done-outline"
            title="Auto mark present"
            description="People who are not on approved leave are marked present. You only set absent or leave."
            onPress={() => {
              setAutoMarkPresent(true);
              setSaved("");
            }}
          />
          <Choice
            selected={!autoMarkPresent}
            icon="create-outline"
            title="Owner marks everyone"
            description="Nothing is filled in until you mark each person."
            onPress={() => {
              setAutoMarkPresent(false);
              setSaved("");
            }}
          />

          <AppText variant="label" style={styles.sectionLabel}>
            Employee login
          </AppText>
          <Choice
            selected={employeesCanMark}
            icon="person-outline"
            title="Employees can mark attendance"
            description="They can mark themselves present from their app."
            onPress={() => {
              setEmployeesCanMark(true);
              setSaved("");
            }}
          />
          <Choice
            selected={!employeesCanMark}
            icon="lock-closed-outline"
            title="Owner only"
            description="Employees can see attendance, but only you can mark it."
            onPress={() => {
              setEmployeesCanMark(false);
              setSaved("");
            }}
          />

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <AppText variant="caption" color={colors.success}>
                {saved}
              </AppText>
            </View>
          ) : null}
          <FieldError message={error} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save attendance settings"
            accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading}
            onPress={save}
            style={({ pressed }) => [styles.footerPrimary, pressed && !loading && styles.pressed, loading && styles.footerDisabled]}
          >
            <Ionicons name="save-outline" size={18} color={loading ? colors.disabledText : colors.textInverse} />
            <AppText variant="label" color={loading ? colors.disabledText : colors.textInverse}>
              {loading ? "Saving..." : "Save settings"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "800", color: colors.text },
  scroll: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  infoTitle: { fontWeight: "700" },
  sectionLabel: { marginTop: spacing.xs, fontWeight: "700" },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceIconSelected: { backgroundColor: colors.surface },
  choiceCopy: { flex: 1, minWidth: 0, gap: 4 },
  choiceTitle: { fontWeight: "700" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  footer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerPrimary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerDisabled: { backgroundColor: colors.disabled },
  pressed: { opacity: 0.9 },
});
