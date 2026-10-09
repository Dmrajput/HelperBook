import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import AttendanceHistoryScreen from "../screens/attendance/AttendanceHistoryScreen";
import AttendanceScreen from "../screens/attendance/AttendanceScreen";
import BulkAttendanceScreen from "../screens/attendance/BulkAttendanceScreen";
import EmployeeAttendanceScreen from "../screens/attendance/EmployeeAttendanceScreen";
import MonthlyAttendanceScreen from "../screens/attendance/MonthlyAttendanceScreen";
import AddEmployeeScreen from "../screens/employees/AddEmployeeScreen";
import EditEmployeeScreen from "../screens/employees/EditEmployeeScreen";
import EmployeeListScreen from "../screens/employees/EmployeeListScreen";
import EmployeeProfileScreen from "../screens/employees/EmployeeProfileScreen";
import AdvanceOverviewScreen from "../screens/advance/AdvanceOverviewScreen";
import EmployeeAdvanceScreen from "../screens/advance/EmployeeAdvanceScreen";
import GiveAdvanceScreen from "../screens/advance/GiveAdvanceScreen";
import RepaymentScreen from "../screens/advance/RepaymentScreen";
import CreateLeaveScreen from "../screens/leave/CreateLeaveScreen";
import LeaveDetailScreen from "../screens/leave/LeaveDetailScreen";
import LeaveHistoryScreen from "../screens/leave/LeaveHistoryScreen";
import LeaveScreen from "../screens/leave/LeaveScreen";
import SalaryDetailScreen from "../screens/salary/SalaryDetailScreen";
import SalaryHistoryScreen from "../screens/salary/SalaryHistoryScreen";
import SalaryPaymentDetailScreen from "../screens/salary/SalaryPaymentDetailScreen";
import SalaryPaymentHistoryScreen from "../screens/salary/SalaryPaymentHistoryScreen";
import SalaryPaymentScreen from "../screens/salary/SalaryPaymentScreen";
import SalaryReceiptScreen from "../screens/salary/SalaryReceiptScreen";
import AdvanceReportScreen from "../screens/reports/AdvanceReportScreen";
import AttendanceReportScreen from "../screens/reports/AttendanceReportScreen";
import LeaveReportScreen from "../screens/reports/LeaveReportScreen";
import PaymentReportScreen from "../screens/reports/PaymentReportScreen";
import ReportsScreen from "../screens/reports/ReportsScreen";
import NotificationScreen from "../screens/notifications/NotificationScreen";
import NotificationSettingsScreen from "../screens/notifications/NotificationSettingsScreen";
import PaymentHistoryScreen from "../screens/subscription/PaymentHistoryScreen";
import SubscriptionHistoryScreen from "../screens/subscription/SubscriptionHistoryScreen";
import SubscriptionScreen from "../screens/subscription/SubscriptionScreen";
import SalaryReportScreen from "../screens/reports/SalaryReportScreen";
import SalaryScreen from "../screens/salary/SalaryScreen";
import ShopProfileScreen from "../screens/shop/ShopProfileScreen";
import ShopSettingsScreen from "../screens/shop/ShopSettingsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MainTabs} />
      <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EmployeeProfile" component={EmployeeProfileScreen} />
      <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} />
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
      <Stack.Screen name="ShopSettings" component={ShopSettingsScreen} />
      <Stack.Screen name="AttendanceDay" component={AttendanceScreen} />
      <Stack.Screen name="BulkAttendance" component={BulkAttendanceScreen} />
      <Stack.Screen name="MonthlyAttendance" component={MonthlyAttendanceScreen} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <Stack.Screen name="EmployeeAttendance" component={EmployeeAttendanceScreen} />
      <Stack.Screen name="Salary" component={SalaryScreen} />
      <Stack.Screen name="SalaryDetail" component={SalaryDetailScreen} />
      <Stack.Screen name="SalaryHistory" component={SalaryHistoryScreen} />
      <Stack.Screen name="SalaryPayment" component={SalaryPaymentScreen} />
      <Stack.Screen name="SalaryPaymentHistory" component={SalaryPaymentHistoryScreen} />
      <Stack.Screen name="SalaryPaymentDetail" component={SalaryPaymentDetailScreen} />
      <Stack.Screen name="SalaryReceipt" component={SalaryReceiptScreen} />
      <Stack.Screen name="AdvanceOverview" component={AdvanceOverviewScreen} />
      <Stack.Screen name="EmployeeAdvance" component={EmployeeAdvanceScreen} />
      <Stack.Screen name="GiveAdvance" component={GiveAdvanceScreen} />
      <Stack.Screen name="Repayment" component={RepaymentScreen} />
      <Stack.Screen name="Leave" component={LeaveScreen} />
      <Stack.Screen name="CreateLeave" component={CreateLeaveScreen} />
      <Stack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
      <Stack.Screen name="LeaveHistory" component={LeaveHistoryScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="AttendanceReport" component={AttendanceReportScreen} />
      <Stack.Screen name="SalaryReport" component={SalaryReportScreen} />
      <Stack.Screen name="AdvanceReport" component={AdvanceReportScreen} />
      <Stack.Screen name="LeaveReport" component={LeaveReportScreen} />
      <Stack.Screen name="PaymentReport" component={PaymentReportScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} />
    </Stack.Navigator>
  );
}
