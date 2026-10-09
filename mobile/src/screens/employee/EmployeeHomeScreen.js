import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import AppScreen from "../../components/AppScreen";
import { getEmployeeHome } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatMonth } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

const STATUS_LABELS = { present: "Present today", absent: "Absent today", half_day: "Half day today", leave: "On leave today", not_marked: "Not marked today" };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function EmployeeHomeScreen({ navigation }) {
  const [home, setHome] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setHome(await getEmployeeHome());
      setError("");
    } catch (loadError) {
      setError(loadError?.isNetworkError ? loadError.message : loadError?.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!home && error) {
    return (
      <AppScreen title="Home" subtitle="Your shop" icon="home" showBack={false}>
        <ErrorView message={error} onRetry={load} />
      </AppScreen>
    );
  }

  const salary = home?.salary;
  return (
    <AppScreen title={`${greeting()}${home?.employee?.name ? `, ${home.employee.name}` : ""}`} subtitle={home?.shop?.name || "Your shop"} icon="home" showBack={false}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <AppText variant="label">Attendance</AppText>
          <AppText variant="body">{STATUS_LABELS[home?.attendanceToday] || "Not marked today"}</AppText>
          <AppButton label="View Attendance" variant="secondary" onPress={() => navigation.navigate("EmployeeAttendance")} />
        </View>
        <View style={styles.card}>
          <AppText variant="label">Salary</AppText>
          {salary ? (
            <AppText variant="body">
              {formatMonth(salary.year, salary.month)} {formatInr(salary.finalSalary)} {salary.paymentStatus === "paid" ? "Paid" : "Unpaid"}
            </AppText>
          ) : (
            <AppText variant="body">No finalized salary records available yet.</AppText>
          )}
          <AppButton label="View Salary" variant="secondary" onPress={() => navigation.navigate("EmployeeSalary")} />
        </View>
        <View style={styles.card}>
          <AppText variant="label">Advance</AppText>
          <AppText variant="body">Outstanding {formatInr(home?.advanceOutstanding || 0)}</AppText>
          <AppButton label="View Khata" variant="secondary" onPress={() => navigation.navigate("EmployeeAdvance")} />
        </View>
        <View style={styles.card}>
          <AppText variant="label">Leave</AppText>
          <AppText variant="body">
            {home?.upcomingLeave ? `${home.upcomingLeave.startDate} - ${home.upcomingLeave.endDate}` : "No upcoming leave"}
          </AppText>
          <AppButton label="Request Leave" variant="secondary" onPress={() => navigation.navigate("EmployeeCreateLeave")} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
});
