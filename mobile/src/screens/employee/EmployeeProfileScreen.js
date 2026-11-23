import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import { useAuth } from "../../context/AuthContext";
import { requestEmployeeAccountDeletion } from "../../services/accountService";
import { getEmployeePortalProfile, getEmployeePreferences, saveEmployeePreferences } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";

const ROLES = {
  helper: "Helper",
  sales_staff: "Sales Staff",
  cashier: "Cashier",
  manager: "Manager",
  delivery: "Delivery",
  cook: "Cook",
  cleaner: "Cleaner",
  driver: "Driver",
  accountant: "Accountant",
  other: "Other",
};

function shortJoined(value) {
  if (!value) return "";
  const key = String(value).slice(0, 10);
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function Toggle({ on }) {
  return (
    <View style={[styles.track, on && styles.trackOn]}>
      <View style={[styles.thumb, on && styles.thumbOn]} />
    </View>
  );
}

export default function EmployeeProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextProfile, nextPreferences] = await Promise.all([getEmployeePortalProfile(), getEmployeePreferences()]);
      setProfile(nextProfile);
      setPreferences(nextPreferences);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function togglePref(key) {
    if (!preferences || saving) return;
    const previous = preferences;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaving(true);
    try {
      setPreferences(await saveEmployeePreferences(next));
    } catch {
      setPreferences(previous);
    } finally {
      setSaving(false);
    }
  }

  const requestDeletion = () => {
    Alert.alert(
      "Delete account",
      "This sends a deletion request for your employee login. Your shop's salary and attendance records are not erased immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request deletion",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await requestEmployeeAccountDeletion();
              Alert.alert(
                "Request received",
                result?.alreadyRequested
                  ? `Request ${result.ticketNumber} is already open.`
                  : `Request ${result.ticketNumber} was received.`
              );
            } catch (deleteError) {
              Alert.alert("Delete account", deleteError?.message || "Unable to send the deletion request.");
            }
          },
        },
      ]
    );
  };

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const employee = profile?.employee;
  const role = employee?.role === "other" ? employee.customRole : ROLES[employee?.role] || employee?.role;
  const initial = String(employee?.name || "E").trim().charAt(0).toUpperCase() || "E";
  const phone = employee?.phone ? `+91 ${String(employee.phone).replace(/\D/g, "").slice(-10)}` : "Not added";
  const joined = shortJoined(employee?.joiningDate);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Settings
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Your account
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
        showsVerticalScrollIndicator={false}
      >
        {error ? <ErrorView message={error} onRetry={load} /> : null}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText variant="heading" color={colors.primary} style={styles.avatarLetter}>
              {initial}
            </AppText>
          </View>
          <View style={styles.profileCopy}>
            <AppText variant="subtitle" style={styles.name} numberOfLines={1}>
              {employee?.name || "Employee"}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {role || "Role"}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {profile?.shop?.name || ""}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {phone}
            </AppText>
            {joined ? (
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {`Joined ${joined}`}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <SettingsRow
            label="Change password"
            icon="lock-closed-outline"
            onPress={() => navigation.navigate("EmployeeChangePassword")}
            first
          />
          <SettingsRow
            label="Notifications"
            icon="notifications-outline"
            onPress={() => navigation.navigate("EmployeeNotifications")}
          />
        </View>

        <View style={styles.card}>
          <AppText variant="label" style={styles.sectionTitle}>
            Notification preferences
          </AppText>
          {preferences ? (
            <>
              <PrefRow
                label="Leave updates"
                value={Boolean(preferences.leaveUpdatesEnabled)}
                onPress={() => togglePref("leaveUpdatesEnabled")}
              />
              <PrefRow
                label="Salary payments"
                value={Boolean(preferences.salaryPaidEnabled)}
                onPress={() => togglePref("salaryPaidEnabled")}
                last
              />
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={confirmLogout}
            style={({ pressed }) => [styles.actionRow, styles.actionFirst, pressed && styles.pressed]}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="log-out-outline" size={18} color={colors.text} />
            </View>
            <AppText variant="label" style={styles.rowLabel}>
              Log out
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            onPress={requestDeletion}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          >
            <View style={[styles.rowIcon, styles.deleteIcon]}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </View>
            <AppText variant="label" color={colors.error} style={styles.rowLabel}>
              Delete account
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsRow({ label, icon, onPress, first = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, first && styles.actionFirst, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <AppText variant="label" style={[styles.rowLabel, styles.rowGrow]}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
    </Pressable>
  );
}

function PrefRow({ label, value, onPress, last }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={onPress}
      style={[styles.prefRow, !last && styles.prefBorder]}
    >
      <AppText variant="label" style={styles.rowLabel}>
        {label}
      </AppText>
      <Toggle on={value} />
    </Pressable>
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
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 2,
  },
  name: {
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    overflow: "hidden",
  },
  sectionTitle: {
    fontWeight: "700",
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionFirst: {
    borderTopWidth: 0,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    backgroundColor: colors.errorBackground,
  },
  rowLabel: {
    fontWeight: "700",
  },
  rowGrow: {
    flex: 1,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 52,
  },
  prefBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.disabled,
    padding: 3,
    justifyContent: "center",
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  thumbOn: {
    alignSelf: "flex-end",
  },
  pressed: {
    opacity: 0.88,
  },
});
