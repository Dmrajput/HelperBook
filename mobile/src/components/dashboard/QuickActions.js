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
      iconColor: "#1C8A52",
      iconBackground: "#E8F8EF",
      accessibilityLabel: "Add Employee",
      onPress: () => navigation.navigate("AddEmployee"),
    },
    {
      id: "attendance",
      title: "Attendance",
      description: "Mark today's attendance",
      icon: "calendar",
      iconColor: "#3B6FE0",
      iconBackground: "#EEF3FF",
      accessibilityLabel: "Attendance",
      onPress: () => setTab("Attendance"),
    },
    {
      id: "salary",
      title: "Salary",
      description: "Calculate & pay staff salary",
      icon: "wallet",
      iconColor: "#1C8A52",
      iconBackground: "#E8F8EF",
      accessibilityLabel: "Salary",
      onPress: () => navigation.navigate("Salary"),
    },
    {
      id: "advance",
      title: "Advance / Khata",
      description: "Track employee advances",
      icon: "book",
      iconColor: "#7A5AF8",
      iconBackground: "#F3EEFF",
      accessibilityLabel: "Advance / Khata",
      onPress: () => navigation.navigate("AdvanceOverview"),
    },
    {
      id: "reports",
      title: "Reports",
      description: "View attendance, salary and more",
      icon: "bar-chart",
      iconColor: "#D4535E",
      iconBackground: "#FDECEC",
      accessibilityLabel: "Reports",
      onPress: () => navigation.navigate("Reports"),
    },
    {
      id: "leave",
      title: "Leave Management",
      description: "Review staff leave",
      icon: "calendar-outline",
      iconColor: "#C8881A",
      iconBackground: "#FFF6E4",
      accessibilityLabel: "Leave Management",
      onPress: () => navigation.navigate("Leave"),
    },
    {
      id: "employees",
      title: "Employees",
      description: employeesDescription,
      icon: "people",
      iconColor: "#0F8F86",
      iconBackground: "#E6F7F6",
      accessibilityLabel: "View Employees",
      onPress: () => setTab("Employees"),
    },
    {
      id: "edit-shop",
      title: "Edit Shop",
      description: "Update shop information",
      icon: "storefront",
      iconColor: "#3B6FE0",
      iconBackground: "#EEF3FF",
      accessibilityLabel: "Edit Shop",
      onPress: () => navigation.navigate("ShopProfile", { edit: true }),
    },
  ];

  return (
    <View style={styles.section}>
      <AppText variant="subtitle" style={styles.title}>Quick Actions</AppText>
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
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    fontWeight: "700",
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
