import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
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
  { key: "Home", label: "Home", icon: "home" },
  { key: "Employees", label: "Employees", icon: "people" },
  { key: "Attendance", label: "Attendance", icon: "calendar" },
  { key: "More", label: "More", icon: "grid" },
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

export default function MainTabs() {
  usePushNotifications();
  const [tab, setTab] = useState("Home");
  const [mounted, setMounted] = useState({ Home: true });
  const insets = useSafeAreaInsets();
  const dashboard = useDashboard(tab === "Home");

  useEffect(() => {
    setMounted((current) => (current[tab] ? current : { ...current, [tab]: true }));
  }, [tab]);

  return (
    <MainTabContext.Provider value={{ tab, setTab }}>
      <View style={styles.shell}>
        <View style={styles.body}>
          {mounted.Home ? (
            <TabPanel active={tab === "Home"}>
              <DashboardScreen {...dashboard} />
            </TabPanel>
          ) : null}
          {mounted.Employees ? (
            <TabPanel active={tab === "Employees"}>
              <EmployeeListScreen embedded />
            </TabPanel>
          ) : null}
          {mounted.Attendance ? (
            <TabPanel active={tab === "Attendance"}>
              <AttendanceScreen embedded />
            </TabPanel>
          ) : null}
          {mounted.More ? (
            <TabPanel active={tab === "More"}>
              <MoreScreen />
            </TabPanel>
          ) : null}
        </View>
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
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
                <Ionicons name={selected ? item.icon : `${item.icon}-outline`} size={18} color={selected ? colors.primary : colors.textSecondary} />
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
  panel: {
    flex: 1,
  },
  panelActive: {
    display: "flex",
  },
  panelHidden: {
    display: "none",
  },
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    gap: 1,
    paddingVertical: 4,
  },
  tabSelected: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
