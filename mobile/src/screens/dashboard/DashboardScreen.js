import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import AttendanceSummary from "../../components/dashboard/AttendanceSummary";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";
import FinancialSummary from "../../components/dashboard/FinancialSummary";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentEmployees from "../../components/dashboard/RecentEmployees";
import TeamCard from "../../components/dashboard/TeamCard";
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

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshDashboard} tintColor={colors.surface} />}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          greeting={greetingLine(user?.fullName, timeZone)}
          shopName={data?.shop?.name || ""}
          dateLabel={todayLabel(timeZone)}
          logoUrl={data?.shop?.logo?.url || ""}
          unreadCount={unreadCount}
          onNotifications={() => navigation.navigate("Notifications")}
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
              <AttendanceSummary attendance={data.attendance} timeZone={timeZone} onPress={openAttendance} />
              <TeamCard
                active={active}
                inactive={inactive}
                attendance={data.attendance}
                onPress={openEmployees}
                onAdd={openAddEmployee}
              />
              <FinancialSummary
                salary={data.salary}
                advance={data.advance}
                onPressSalary={() => navigation.navigate("Salary", { paymentFilter: "unpaid" })}
                onPressAdvance={() => navigation.navigate("AdvanceOverview")}
                onViewDetails={() => navigation.navigate("Salary")}
              />
              <View style={styles.section}>
                <View style={styles.titleRow}>
                  <AppText variant="subtitle" style={styles.sectionTitle}>Recent Salary Payments</AppText>
                  <Pressable accessibilityRole="button" accessibilityLabel="View all salary payments" onPress={() => navigation.navigate("SalaryPaymentHistory")}>
                    <AppText variant="label" color={colors.primary} style={styles.link}>View All ›</AppText>
                  </Pressable>
                </View>
                {(data.recentPayments || []).length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="document-text-outline" size={22} color={colors.placeholder} />
                    <AppText variant="label">No salary payments yet.</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Payments will appear here once processed.
                    </AppText>
                  </View>
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
                      <AppText variant="label">{payment.employeeName}</AppText>
                      <AppText variant="body">{formatInr(payment.amount)}</AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {methodLabel(payment.paymentMethod)} · {paymentWhen(payment.paymentDate)}
                      </AppText>
                    </Pressable>
                  ))
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Pending leave, ${pendingLeave}`}
                onPress={() => navigation.navigate("Leave")}
                style={styles.leaveCard}
              >
                <View style={styles.leaveIcon}>
                  <Ionicons name="calendar" size={18} color="#C8881A" />
                </View>
                <View style={styles.leaveCopy}>
                  <AppText variant="label">Pending Leave</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {pendingLeave ? `${pendingLeave} request${pendingLeave === 1 ? "" : "s"} to review` : "No pending leave requests"}
                  </AppText>
                </View>
                <AppText variant="heading" style={styles.leaveCount}>{String(pendingLeave)}</AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
              </Pressable>
            </>
          ) : null}
          <QuickActions activeCount={data ? data.employees.active : undefined} />
          {data ? (
            <RecentEmployees
              employees={data.recentEmployees}
              timeZone={timeZone}
              onPressEmployee={openEmployee}
              onViewAll={openEmployees}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7F5",
  },
  content: {
    paddingBottom: spacing.xl,
  },
  body: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "700",
    flex: 1,
  },
  link: {
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  payment: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: 2,
  },
  leaveCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FFF4EC",
    borderRadius: 18,
    padding: spacing.md,
  },
  leaveIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE4CC",
    alignItems: "center",
    justifyContent: "center",
  },
  leaveCopy: {
    flex: 1,
    minWidth: 0,
  },
  leaveCount: {
    fontSize: 22,
    lineHeight: 28,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
});
