import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import AttendanceSummary from "../../components/dashboard/AttendanceSummary";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";
import FinancialSummary from "../../components/dashboard/FinancialSummary";
import MetricCard from "../../components/dashboard/MetricCard";
import QuickActionCard from "../../components/dashboard/QuickActionCard";
import RecentEmployees from "../../components/dashboard/RecentEmployees";
import { useAuth } from "../../context/AuthContext";
import { useMainTab } from "../../navigation/mainTabContext";
import { colors, spacing } from "../../theme";
import { greetingLine, todayLabel } from "../../utils/dashboardFormat";

function isShopRequired(error) {
  return error?.status === 404 && /shop setup/i.test(error?.message || "");
}

export default function DashboardScreen({
  data,
  isLoading,
  isRefreshing,
  error,
  loadDashboard,
  refreshDashboard,
}) {
  const navigation = useNavigation();
  const { setTab } = useMainTab();
  const { user } = useAuth();
  const timeZone = data?.shop?.timezone || "Asia/Kolkata";

  const openEmployees = () => setTab("Employees");
  const openAddEmployee = () => navigation.navigate("AddEmployee");
  const openEmployee = (employee) => navigation.navigate("EmployeeProfile", { employeeId: employee.id });

  if (isShopRequired(error) && !data) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <AppText variant="heading" accessibilityRole="header">
            Shop Setup Required
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Create your shop profile before using HelperBook.
          </AppText>
          <AppButton label="Set Up Shop" onPress={loadDashboard} />
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading && !data) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !data) {
    const offline = Boolean(error.isNetworkError);
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <ErrorView
          title={offline ? "No internet connection" : "Unable to load dashboard."}
          message={offline ? "Please check your connection and try again." : ""}
          onRetry={loadDashboard}
        />
      </ScreenContainer>
    );
  }

  const active = data?.employees?.active ?? 0;
  const inactive = data?.employees?.inactive ?? 0;
  const noEmployees = active === 0 && inactive === 0;
  const teamSubtitle = inactive > 0 ? `Active staff\n${inactive} Inactive` : "Active staff";

  return (
    <ScreenContainer edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshDashboard} />}
        showsVerticalScrollIndicator={false}
      >
        {isRefreshing ? (
          <AppText variant="caption" color={colors.textSecondary}>
            Loading latest data...
          </AppText>
        ) : null}
        {error ? (
          <ErrorView
            title={error.isNetworkError ? "No internet connection" : "Unable to load dashboard."}
            message={error.isNetworkError ? "Please check your connection and try again." : ""}
            onRetry={loadDashboard}
          />
        ) : null}
        <DashboardHeader
          greeting={greetingLine(user?.fullName, timeZone)}
          shopName={data?.shop?.name || ""}
          dateLabel={todayLabel(timeZone)}
          logoUrl={data?.shop?.logo?.url || ""}
        />
        <AttendanceSummary attendance={data?.attendance} timeZone={timeZone} />
        <View style={styles.section}>
          <AppText variant="subtitle">Your Team</AppText>
          {noEmployees ? (
            <View style={styles.empty}>
              <AppText variant="label">No employees yet</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                Add your first employee to start managing your team.
              </AppText>
              <AppButton label="+ Add Employee" onPress={openAddEmployee} />
            </View>
          ) : (
            <View style={styles.section}>
              <MetricCard
                title="Total Employees"
                value={String(active)}
                subtitle={teamSubtitle}
                onPress={openEmployees}
              />
              <AppButton label="View Employees →" variant="secondary" onPress={openEmployees} />
            </View>
          )}
        </View>
        <FinancialSummary salary={data?.salary} advance={data?.advance} />
        <View style={styles.section}>
          <AppText variant="subtitle">Quick Actions</AppText>
          <QuickActionCard title="+ Add Employee" onPress={openAddEmployee} />
        </View>
        <RecentEmployees
          employees={data?.recentEmployees}
          timeZone={timeZone}
          onPressEmployee={openEmployee}
          onViewAll={openEmployees}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingVertical: spacing.md,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
});
