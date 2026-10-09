import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import usePushNotifications from "../hooks/usePushNotifications";
import EmployeeAdvanceScreen from "../screens/employee/EmployeeAdvanceScreen";
import EmployeeAttendanceScreen from "../screens/employee/EmployeeAttendanceScreen";
import EmployeeCreateLeaveScreen from "../screens/employee/EmployeeCreateLeaveScreen";
import EmployeeHomeScreen from "../screens/employee/EmployeeHomeScreen";
import EmployeeLeaveDetailScreen from "../screens/employee/EmployeeLeaveDetailScreen";
import EmployeeLeaveScreen from "../screens/employee/EmployeeLeaveScreen";
import EmployeeNotificationsScreen from "../screens/employee/EmployeeNotificationsScreen";
import EmployeeProfileScreen from "../screens/employee/EmployeeProfileScreen";
import EmployeeSalaryReceiptScreen from "../screens/employee/EmployeeSalaryReceiptScreen";
import EmployeeSalaryScreen from "../screens/employee/EmployeeSalaryScreen";
import { colors, spacing } from "../theme";

const Stack = createNativeStackNavigator();
const TABS = [
  { key: "Home", label: "Home" },
  { key: "Attendance", label: "Attendance" },
  { key: "Salary", label: "Salary" },
  { key: "Leave", label: "Leave" },
  { key: "Profile", label: "Profile" },
];

function EmployeeTabs({ navigation }) {
  usePushNotifications();
  const [tab, setTab] = useState("Home");
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.shell}>
      <View style={styles.body}>
        {tab === "Home" ? <EmployeeHomeScreen navigation={navigation} /> : null}
        {tab === "Attendance" ? <EmployeeAttendanceScreen /> : null}
        {tab === "Salary" ? <EmployeeSalaryScreen navigation={navigation} /> : null}
        {tab === "Leave" ? <EmployeeLeaveScreen navigation={navigation} /> : null}
        {tab === "Profile" ? <EmployeeProfileScreen navigation={navigation} /> : null}
      </View>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {TABS.map((item) => (
          <Pressable key={item.key} onPress={() => setTab(item.key)} style={styles.tab}>
            <AppText variant="caption" color={tab === item.key ? colors.primary : colors.textSecondary}>{item.label}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EmployeeTabs" component={EmployeeTabs} options={{ headerShown: false }} />
      <Stack.Screen name="EmployeeAttendance" component={EmployeeAttendanceScreen} options={{ title: "Attendance" }} />
      <Stack.Screen name="EmployeeSalary" component={EmployeeSalaryScreen} options={{ title: "Salary" }} />
      <Stack.Screen name="EmployeeSalaryDetail" component={EmployeeSalaryScreen} options={{ title: "Salary" }} />
      <Stack.Screen name="EmployeeAdvance" component={EmployeeAdvanceScreen} options={{ title: "Advance" }} />
      <Stack.Screen name="EmployeeCreateLeave" component={EmployeeCreateLeaveScreen} options={{ title: "Request Leave" }} />
      <Stack.Screen name="EmployeeLeaveDetail" component={EmployeeLeaveDetailScreen} options={{ title: "Leave" }} />
      <Stack.Screen name="EmployeeSalaryReceipt" component={EmployeeSalaryReceiptScreen} options={{ title: "Receipt" }} />
      <Stack.Screen name="EmployeeNotifications" component={EmployeeNotificationsScreen} options={{ title: "Notifications" }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bar: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  tab: { flex: 1, alignItems: "center", paddingVertical: spacing.sm },
});
