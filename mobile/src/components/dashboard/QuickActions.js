import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import QuickActionCard from "./QuickActionCard";
import { colors, spacing } from "../../theme";

export default function QuickActions({ activeCount = 0 }) {
  const navigation = useNavigation();
  const hasEmployees = activeCount > 0;

  const actions = [
    {
      id: "add-employee",
      title: "Add employee",
      icon: "person-add-outline",
      iconColor: colors.primary,
      iconBackground: colors.primaryLight,
      onPress: () => navigation.navigate("AddEmployee"),
      disabled: false,
    },
    {
      id: "salary",
      title: "Pay salary",
      icon: "wallet-outline",
      iconColor: colors.secondary,
      iconBackground: colors.secondaryLight,
      onPress: () => navigation.navigate("Salary"),
      disabled: !hasEmployees,
    },
    {
      id: "advance",
      title: "Give advance",
      icon: "cash-outline",
      iconColor: "#0EA5E9",
      iconBackground: "#E0F2FE",
      onPress: () => navigation.navigate("AdvanceOverview"),
      disabled: !hasEmployees,
    },
  ];

  return (
    <View style={styles.section}>
      <SectionHeader title="Quick actions" />
      <View style={styles.row}>
        {actions.map((action) => (
          <View key={action.id} style={styles.cell}>
            <QuickActionCard
              title={action.title}
              icon={action.icon}
              iconColor={action.iconColor}
              iconBackground={action.iconBackground}
              accessibilityLabel={
                action.disabled ? `${action.title}. Add an employee first.` : action.title
              }
              onPress={action.onPress}
              disabled={action.disabled}
              compact
            />
          </View>
        ))}
      </View>
      {!hasEmployees ? (
        <AppText variant="caption" color={colors.textSecondary}>
          Add an employee to unlock salary and advances.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
});
