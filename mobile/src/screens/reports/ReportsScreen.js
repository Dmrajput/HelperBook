import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppText from "../../components/AppText";
import ScreenContainer from "../../components/ScreenContainer";
import { colors, spacing } from "../../theme";

const REPORTS = [
  { route: "AttendanceReport", title: "Attendance", description: "Track employee attendance" },
  { route: "SalaryReport", title: "Salary", description: "View salary calculations" },
  { route: "AdvanceReport", title: "Advance / Khata", description: "Track employee advances" },
  { route: "LeaveReport", title: "Leave", description: "View employee leave" },
  { route: "PaymentReport", title: "Payments", description: "Track salary payments" },
];

export default function ReportsScreen() {
  const navigation = useNavigation();
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          Reports
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          View and export your business reports.
        </AppText>
        {REPORTS.map((report) => (
          <Pressable
            key={report.route}
            accessibilityRole="button"
            accessibilityLabel={report.title}
            onPress={() => navigation.navigate(report.route)}
            style={styles.card}
          >
            <AppText variant="subtitle">{report.title}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {report.description}
            </AppText>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 72,
    justifyContent: "center",
  },
});
