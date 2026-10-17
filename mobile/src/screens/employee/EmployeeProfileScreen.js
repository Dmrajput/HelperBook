import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import { useAuth } from "../../context/AuthContext";
import { requestEmployeeAccountDeletion } from "../../services/accountService";
import { getEmployeePortalProfile, getEmployeePreferences, saveEmployeePreferences } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate } from "../../utils/attendanceFormat";

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

function SettingsRow({ label, icon, onPress, subtitle, first = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, first && styles.rowFirst]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <AppText variant="label">{label}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
    </Pressable>
  );
}

export default function EmployeeProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  useFocusEffect(useCallback(() => { load(); }, [load]));

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

  return (
    <AppScreen title="Settings" subtitle={profile?.shop?.name || "Your account"} icon="settings-outline" showBack={false}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}>
        {error ? <ErrorView message={error} onRetry={load} /> : null}

        <View style={styles.card}>
          <AppText variant="caption" color={colors.textSecondary}>
            My Profile
          </AppText>
          <AppText variant="subtitle" style={styles.name}>
            {employee?.name}
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {role}
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {profile?.shop?.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Phone {employee?.phone ? `+91 ${String(employee.phone).replace(/\D/g, "").slice(-10)}` : "Not added"}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Joined {employee?.joiningDate ? formatAttendanceDate(String(employee.joiningDate).slice(0, 10)) : ""}
          </AppText>
        </View>

        <View style={styles.card}>
          <SettingsRow
            label="Change Password"
            subtitle="Update your login password"
            icon="lock-closed-outline"
            onPress={() => navigation.navigate("EmployeeChangePassword")}
            first
          />
          <SettingsRow
            label="Notifications"
            subtitle="View recent alerts"
            icon="notifications-outline"
            onPress={() => navigation.navigate("EmployeeNotifications")}
          />
        </View>

        <View style={styles.card}>
          <AppText variant="label">Notification preferences</AppText>
          {preferences ? (
            <>
              <AppButton
                label={`Leave updates ${preferences.leaveUpdatesEnabled ? "on" : "off"}`}
                variant="secondary"
                onPress={() =>
                  saveEmployeePreferences({ ...preferences, leaveUpdatesEnabled: !preferences.leaveUpdatesEnabled }).then(setPreferences)
                }
              />
              <AppButton
                label={`Salary paid ${preferences.salaryPaidEnabled ? "on" : "off"}`}
                variant="secondary"
                onPress={() =>
                  saveEmployeePreferences({ ...preferences, salaryPaidEnabled: !preferences.salaryPaidEnabled }).then(setPreferences)
                }
              />
            </>
          ) : null}
        </View>

        <AppButton label="Logout" variant="secondary" onPress={confirmLogout} />
        <AppButton label="Delete account" variant="secondary" onPress={requestDeletion} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  name: { fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  rowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
