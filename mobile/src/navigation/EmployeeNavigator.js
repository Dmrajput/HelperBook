import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
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
import EmployeeChangePasswordScreen from "../screens/employeeAuth/EmployeeChangePasswordScreen";
import { colors, spacing } from "../theme";

const Stack = createNativeStackNavigator();
const TABS = [
  { key: "Home", label: "Home", icon: "home", iconOutline: "home-outline" },
  { key: "Attendance", label: "Attendance", icon: "calendar", iconOutline: "calendar-outline" },
  { key: "Salary", label: "Salary", icon: "wallet", iconOutline: "wallet-outline" },
  { key: "Leave", label: "Leave", icon: "calendar-number", iconOutline: "calendar-number-outline" },
  { key: "Profile", label: "Settings", icon: "settings", iconOutline: "settings-outline" },
];

function TabPanel({ active, children }) {
  return (
    <View
      style={[styles.panel, active ? styles.panelActive : styles.panelHidden]}
      pointerEvents={active ? "auto" : "none"}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      collapsable={false}
    >
      {children}
    </View>
  );
}

function EmployeeTabs({ navigation }) {
  usePushNotifications();
  const [tab, setTab] = useState("Home");
  const [mounted, setMounted] = useState({ Home: true });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMounted((current) => (current[tab] ? current : { ...current, [tab]: true }));
  }, [tab]);

  return (
    <View style={styles.shell}>
      <View style={styles.body}>
        {mounted.Home ? (
          <TabPanel active={tab === "Home"}>
            <EmployeeHomeScreen navigation={navigation} onOpenTab={setTab} />
          </TabPanel>
        ) : null}
        {mounted.Attendance ? (
          <TabPanel active={tab === "Attendance"}>
            <EmployeeAttendanceScreen navigation={navigation} embedded />
          </TabPanel>
        ) : null}
        {mounted.Salary ? (
          <TabPanel active={tab === "Salary"}>
            <EmployeeSalaryScreen navigation={navigation} />
          </TabPanel>
        ) : null}
        {mounted.Leave ? (
          <TabPanel active={tab === "Leave"}>
            <EmployeeLeaveScreen navigation={navigation} />
          </TabPanel>
        ) : null}
        {mounted.Profile ? (
          <TabPanel active={tab === "Profile"}>
            <EmployeeProfileScreen navigation={navigation} />
          </TabPanel>
        ) : null}
      </View>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              <View style={[styles.tabIconWrap, active && styles.tabIconActive]}>
                <Ionicons
                  name={active ? item.icon : item.iconOutline}
                  size={20}
                  color={active ? colors.primary : colors.textSecondary}
                />
              </View>
              <AppText variant="caption" color={active ? colors.primary : colors.textSecondary} numberOfLines={1}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
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
      <Stack.Screen name="EmployeeChangePassword" component={EmployeeChangePasswordScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  panel: { flex: 1 },
  panelActive: { display: "flex" },
  panelHidden: { display: "none" },
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.xs,
  },
  tabIconWrap: {
    width: 36,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: {
    backgroundColor: colors.primaryLight,
  },
});
