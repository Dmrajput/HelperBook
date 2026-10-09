import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppText from "../AppText";
import { useMainTab } from "../../navigation/mainTabContext";
import { spacing } from "../../theme";
import QuickActionCard from "./QuickActionCard";

export default function QuickActions({ activeCount }) {
  const navigation = useNavigation();
  const { setTab } = useMainTab();
  const employeesDescription = Number.isInteger(activeCount)
    ? `${activeCount} active staff`
    : "View your team";

  const actions = [
    {
      id: "add-employee",
      title: "Add Employee",
      description: "Add a new staff member",
      icon: "person-add",
      accessibilityLabel: "Add Employee",
      onPress: () => navigation.navigate("AddEmployee"),
    },
    {
      id: "attendance",
      title: "Attendance",
      description: "Mark today's staff attendance",
      icon: "calendar",
      accessibilityLabel: "Attendance",
      onPress: () => setTab("Attendance"),
    },
    {
      id: "salary",
      title: "Salary",
      description: "Calculate & pay staff salary",
      icon: "wallet",
      accessibilityLabel: "Salary",
      onPress: () => navigation.navigate("Salary"),
    },
    {
      id: "advance",
      title: "Advance / Khata",
      description: "Track employee advances",
      icon: "book",
      accessibilityLabel: "Advance / Khata",
      onPress: () => navigation.navigate("AdvanceOverview"),
    },
    {
      id: "reports",
      title: "Reports",
      description: "View attendance, salary and payment reports",
      icon: "document-text",
      accessibilityLabel: "Reports",
      onPress: () => navigation.navigate("Reports"),
    },
    {
      id: "leave",
      title: "Leave Management",
      description: "Review staff leave",
      icon: "calendar-outline",
      accessibilityLabel: "Leave Management",
      onPress: () => navigation.navigate("Leave"),
    },
    {
      id: "employees",
      title: "Employees",
      description: employeesDescription,
      icon: "people",
      accessibilityLabel: "View Employees",
      onPress: () => navigation.navigate("EmployeeList"),
    },
    {
      id: "edit-shop",
      title: "Edit Shop",
      description: "Update shop information",
      icon: "storefront",
      accessibilityLabel: "Edit Shop",
      onPress: () => navigation.navigate("ShopProfile", { edit: true }),
    },
    {
      id: "shop-settings",
      title: "Shop Settings",
      description: "Manage shop preferences",
      icon: "settings",
      accessibilityLabel: "Shop Settings",
      onPress: () => navigation.navigate("ShopSettings"),
    },
  ];

  return (
    <View style={styles.section}>
      <AppText variant="subtitle">Quick Actions</AppText>
      <View style={styles.grid}>
        {actions.map((action) => (
          <View key={action.id} style={styles.cell}>
            <QuickActionCard
              title={action.title}
              description={action.description}
              icon={action.icon}
              accessibilityLabel={action.accessibilityLabel}
              onPress={action.onPress}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.sm,
  },
  cell: {
    width: "48%",
  },
});
