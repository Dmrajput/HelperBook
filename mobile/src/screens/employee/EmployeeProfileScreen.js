import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import { useAuth } from "../../context/AuthContext";
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

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const employee = profile?.employee;
  const role = employee?.role === "other" ? employee.customRole : ROLES[employee?.role] || employee?.role;

  return (
    <AppScreen title="Profile" subtitle={profile?.shop?.name || "Your account"} icon="person" showBack={false}>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />} contentContainerStyle={styles.content}>
        {error ? <ErrorView message={error} onRetry={load} /> : null}
        <AppText variant="subtitle">{employee?.name}</AppText>
        <AppText variant="body">{role}</AppText>
        <AppText variant="body">{profile?.shop?.name}</AppText>
        <AppText variant="body">Phone {employee?.phone ? `+91 ${employee.phone}` : "Not added"}</AppText>
        <AppText variant="body">Joined {employee?.joiningDate ? formatAttendanceDate(String(employee.joiningDate).slice(0, 10)) : ""}</AppText>
        <AppText variant="label">Notifications</AppText>
        {preferences ? (
          <>
            <AppButton
              label={`Leave updates ${preferences.leaveUpdatesEnabled ? "on" : "off"}`}
              variant="secondary"
              onPress={() => saveEmployeePreferences({ ...preferences, leaveUpdatesEnabled: !preferences.leaveUpdatesEnabled }).then(setPreferences)}
            />
            <AppButton
              label={`Salary paid ${preferences.salaryPaidEnabled ? "on" : "off"}`}
              variant="secondary"
              onPress={() => saveEmployeePreferences({ ...preferences, salaryPaidEnabled: !preferences.salaryPaidEnabled }).then(setPreferences)}
            />
          </>
        ) : null}
        <AppButton label="Notifications" variant="secondary" onPress={() => navigation.navigate("EmployeeNotifications")} />
        <AppButton label="Logout" variant="secondary" onPress={confirmLogout} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
});
