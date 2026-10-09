import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
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
import QuickActions from "../../components/dashboard/QuickActions";
import RecentEmployees from "../../components/dashboard/RecentEmployees";
import { methodLabel } from "../../constants/salaryPayment";
import { useUnreadCount } from "../../hooks/useNotifications";
import { useAuth } from "../../context/AuthContext";
import { useMainTab } from "../../navigation/mainTabContext";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, shiftKey, todayKey } from "../../utils/attendanceFormat";
import { formatInr, greetingLine, todayLabel } from "../../utils/dashboardFormat";

function paymentWhen(key) {
  if (!key) return "";
  if (key === todayKey()) return "Today";
  if (key === shiftKey(todayKey(), -1)) return "Yesterday";
  return formatAttendanceDate(key);
}

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
        {isLoading && !data ? <DashboardSkeleton /> : null}
        {data ? (
          <>
        <DashboardHeader
          greeting={greetingLine(user?.fullName, timeZone)}
          shopName={data?.shop?.name || ""}
          dateLabel={todayLabel(timeZone)}
          logoUrl={data?.shop?.logo?.url || ""}
          unreadCount={unreadCount}
          onNotifications={() => navigation.navigate("Notifications")}
        />
        {data?.subscription ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Subscription")}
            style={styles.planCard}
          >
            <AppText variant="label">
              {data.subscription.isTrial ? `${data.subscription.planName} Trial` : data.subscription.planName}
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {`${data.subscription.activeEmployeeCount} / ${data.subscription.employeeLimit} employees`}
              {data.subscription.isTrial && data.subscription.trialDaysRemaining !== null
                ? `\n${data.subscription.trialDaysRemaining} days left`
                : ""}
            </AppText>
          </Pressable>
        ) : null}
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
        <FinancialSummary
          salary={data?.salary}
          advance={data?.advance}
          onPressSalary={() => navigation.navigate("Salary", { paymentFilter: "unpaid" })}
        />
        <View style={styles.section}>
          <AppText variant="subtitle">Recent Salary Payments</AppText>
          {(data?.recentPayments || []).length === 0 ? (
            <AppText variant="body" color={colors.textSecondary}>
              No salary payments yet.
            </AppText>
          ) : (
            (data.recentPayments || []).map((payment) => (
              <Pressable
                key={payment.id}
                accessibilityRole="button"
                accessibilityLabel={`${payment.employeeName}, ${formatInr(payment.amount)}`}
                onPress={() =>
                  navigation.navigate(payment.salaryId ? "SalaryReceipt" : "SalaryPaymentDetail", payment.salaryId
                    ? { salaryId: payment.salaryId }
                    : { paymentId: payment.id })
                }
                style={styles.payment}
              >
                <AppText variant="subtitle">{payment.employeeName}</AppText>
                <AppText variant="body">{formatInr(payment.amount)}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {methodLabel(payment.paymentMethod)} · {paymentWhen(payment.paymentDate)}
                </AppText>
              </Pressable>
            ))
          )}
          <AppButton label="View All" variant="secondary" onPress={() => navigation.navigate("SalaryPaymentHistory")} />
        </View>
        <MetricCard
          title="Pending Leave"
          value={String(data?.leave?.pendingRequests ?? 0)}
          subtitle={data?.leave?.pendingRequests ? "Requests to review" : "No pending leave"}
          onPress={() => navigation.navigate("Leave")}
        />
          </>
        ) : null}
        <QuickActions activeCount={data ? data.employees.active : undefined} />
        {data ? (
        <RecentEmployees
          employees={data?.recentEmployees}
          timeZone={timeZone}
          onPressEmployee={openEmployee}
          onViewAll={openEmployees}
        />
        ) : null}
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
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  payment: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
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
