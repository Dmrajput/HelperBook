import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import QuickActionCard from "./QuickActionCard";
import { useMainTab } from "../../navigation/mainTabContext";
import { colors, spacing } from "../../theme";

export default function QuickActions({ activeCount = 0, notMarkedToday = 0, isWorkingDay = true }) {
  const navigation = useNavigation();
  const { setTab } = useMainTab();
  const hasEmployees = activeCount > 0;
  const needsAttendance = hasEmployees && isWorkingDay && notMarkedToday > 0;

  const actions = [
    {
      id: "add-employee",
      title: "Employee",
      description: "Add staff",
      icon: "person-add-outline",
      iconColor: colors.primary,
      iconBackground: colors.primaryLight,
      onPress: () => navigation.navigate("AddEmployee"),
      priority: hasEmployees ? 3 : 0,
    },
    {
      id: "attendance",
      title: "Attendance",
      description: needsAttendance ? "Mark today" : "View today",
      icon: "calendar-outline",
      iconColor: colors.success,
      iconBackground: colors.successBackground,
      onPress: () => setTab("Attendance"),
      disabled: !hasEmployees,
      priority: needsAttendance ? 0 : 2,
    },
    {
      id: "salary",
      title: "Salary",
      description: "Process pay",
      icon: "wallet-outline",
      iconColor: colors.secondary,
      iconBackground: colors.secondaryLight,
      onPress: () => navigation.navigate("Salary"),
      disabled: !hasEmployees,
      priority: 4,
    },
    {
      id: "advance",
      title: "Advance",
      description: "Give advance",
      icon: "cash-outline",
      iconColor: colors.warning,
      iconBackground: colors.warningBackground,
      onPress: () => navigation.navigate("AdvanceOverview"),
      disabled: !hasEmployees,
      priority: 5,
    },
    {
      id: "leave",
      title: "Leave",
      description: "Manage leave",
      icon: "document-text-outline",
      iconColor: colors.info,
      iconBackground: colors.infoBackground,
      onPress: () => navigation.navigate("Leave"),
      disabled: !hasEmployees,
      priority: 6,
    },
    {
      id: "reports",
      title: "Reports",
      description: "View reports",
      icon: "bar-chart-outline",
      iconColor: colors.accent,
      iconBackground: colors.accentLight,
      onPress: () => navigation.navigate("Reports"),
      disabled: !hasEmployees,
      priority: 7,
    },
  ]
    .map((action) => ({
      ...action,
      accessibilityLabel: action.disabled
        ? `${action.title}. Add an employee first.`
        : `${action.title}. ${action.description}`,
    }))
    .sort((a, b) => a.priority - b.priority);

  return (
    <View style={styles.section}>
      <SectionHeader title="Quick actions" sideLabel="Most used" />
      <View style={styles.grid}>
        {actions.map((action) => (
          <View key={action.id} style={styles.cell}>
            <QuickActionCard
              title={action.title}
              description={action.description}
              icon={action.icon}
              iconColor={action.iconColor}
              iconBackground={action.iconBackground}
              accessibilityLabel={action.accessibilityLabel}
              onPress={action.onPress}
              disabled={action.disabled}
              compact
            />
          </View>
        ))}
      </View>
      {!hasEmployees ? (
        <AppText variant="caption" color={colors.textSecondary}>
          Add an employee to unlock attendance, salary, advance, leave, and reports.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cell: {
    width: "33.33%",
  },
});
