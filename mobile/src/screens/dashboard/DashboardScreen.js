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
// import QuickActions from "../../components/dashboard/QuickActions";
import RecentActivity from "../../components/dashboard/RecentActivity";
import TeamCard from "../../components/dashboard/TeamCard";
import { useUnreadCount } from "../../hooks/useNotifications";
import { useAuth } from "../../context/AuthContext";
import { useMainTab } from "../../navigation/mainTabContext";
import { colors, spacing } from "../../theme";
import { greetingLine, todayLabel } from "../../utils/dashboardFormat";

const PAGE_BG = colors.background;

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
  const unreadCount = useUnreadCount();
  const timeZone = data?.shop?.timezone || "Asia/Kolkata";

  const openEmployees = () => setTab("Employees");
  const openAddEmployee = () => navigation.navigate("AddEmployee");
  const openEmployee = (employee) => navigation.navigate("EmployeeProfile", { employeeId: employee.id });
  const openAttendance = () => setTab("Attendance");

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

  const active = data?.employees?.active ?? 0;
  const inactive = data?.employees?.inactive ?? 0;
  const pendingLeave = data?.leave?.pendingRequests ?? 0;
  const hasEmployees = active > 0 || inactive > 0;
  const hasActiveEmployees = active > 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshDashboard} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          greeting={greetingLine(user?.fullName, timeZone)}
          shopName={data?.shop?.name || ""}
          dateLabel={todayLabel(timeZone)}
          unreadCount={unreadCount}
          onNotifications={() => navigation.navigate("Notifications")}
          onSettings={() => navigation.navigate("ShopProfile")}
        />
        <View style={styles.body}>
          {error ? (
            <ErrorView
              title={error.isNetworkError ? "No internet connection" : "Unable to load dashboard."}
              message={error.isNetworkError ? "Please check your connection and try again." : ""}
              onRetry={loadDashboard}
            />
          ) : null}
          {isLoading && !data ? <DashboardSkeleton /> : null}
          {data ? (
            <>
              <TeamCard
                active={active}
                inactive={inactive}
                attendance={data.attendance}
                onAdd={openAddEmployee}
                onPressEmployees={openEmployees}
              />
              {hasActiveEmployees ? (
                <>
                  <AttendanceSummary
                    attendance={data.attendance}
                    timeZone={timeZone}
                    onPress={openAttendance}
                  />
                  <FinancialSummary
                    salary={data.salary}
                    advance={data.advance}
                    timeZone={timeZone}
                    onPressSalary={() => navigation.navigate("Salary", { paymentFilter: "unpaid" })}
                    onPressAdvance={() => navigation.navigate("AdvanceOverview")}
                    onViewDetails={() => navigation.navigate("Salary")}
                  />
                </>
              ) : null}
              {/* <QuickActions activeCount={active} /> */}
              {hasEmployees ? (
                <RecentActivity
                  recentPayments={data.recentPayments || []}
                  recentEmployees={data.recentEmployees || []}
                  pendingLeave={pendingLeave}
                  onPressLeave={() => navigation.navigate("Leave")}
                  onPressEmployee={openEmployee}
                  onViewPayments={() => navigation.navigate("SalaryPaymentHistory")}
                  onPressPayment={(payment) =>
                    navigation.navigate(
                      payment.salaryId ? "SalaryReceipt" : "SalaryPaymentDetail",
                      payment.salaryId ? { salaryId: payment.salaryId } : { paymentId: payment.id }
                    )
                  }
                />
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  content: {
    paddingBottom: spacing.lg,
  },
  body: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
});

