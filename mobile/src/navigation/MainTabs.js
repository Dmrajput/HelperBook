import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import { useDashboard } from "../hooks/useDashboard";
import usePushNotifications from "../hooks/usePushNotifications";
import AttendanceScreen from "../screens/attendance/AttendanceScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import EmployeeListScreen from "../screens/employees/EmployeeListScreen";
import MoreScreen from "../screens/MoreScreen";
import { colors, spacing } from "../theme";
import { MainTabContext } from "./mainTabContext";

const TABS = [
  { key: "Home", label: "Home" },
  { key: "Employees", label: "Employees" },
  { key: "Attendance", label: "Attendance" },
  { key: "More", label: "More" },
];

export default function MainTabs() {
  usePushNotifications();
  const [tab, setTab] = useState("Home");
  const insets = useSafeAreaInsets();
  const dashboard = useDashboard(tab === "Home");

  return (
    <MainTabContext.Provider value={{ tab, setTab }}>
      <View style={styles.shell}>
        <View style={styles.body}>
          {tab === "Home" ? <DashboardScreen {...dashboard} /> : null}
          {tab === "Employees" ? <EmployeeListScreen embedded /> : null}
          {tab === "Attendance" ? <AttendanceScreen embedded /> : null}
          {tab === "More" ? <MoreScreen /> : null}
        </View>
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          {TABS.map((item) => {
            const selected = tab === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
                onPress={() => setTab(item.key)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <AppText
                  variant="label"
                  color={selected ? colors.primary : colors.textSecondary}
                  align="center"
                  numberOfLines={1}
                  style={styles.tabLabel}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </MainTabContext.Provider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 3,
    borderTopColor: "transparent",
  },
  tabSelected: {
    borderTopColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
});
