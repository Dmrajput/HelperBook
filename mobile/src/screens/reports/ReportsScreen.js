import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AppScreen from "../../components/AppScreen";
import AppText from "../../components/AppText";
import { colors, spacing } from "../../theme";

const REPORTS = [
  { route: "AttendanceReport", title: "Attendance", description: "How staff attended", icon: "calendar", iconColor: "#3B6FE0", iconBackground: "#EEF3FF" },
  { route: "SalaryReport", title: "Salary", description: "Calculated pay for the period", icon: "wallet", iconColor: "#1C8A52", iconBackground: "#E8F8EF" },
  { route: "AdvanceReport", title: "Advance / Khata", description: "Money given and repaid", icon: "book", iconColor: "#7A5AF8", iconBackground: "#F3EEFF" },
  { route: "LeaveReport", title: "Leave", description: "Approved and pending leave", icon: "sunny", iconColor: "#C8881A", iconBackground: "#FFF6E4" },
  { route: "PaymentReport", title: "Payments", description: "Salary already paid", icon: "cash", iconColor: "#D4535E", iconBackground: "#FDECEC" },
];

export default function ReportsScreen() {
  const navigation = useNavigation();
  return (
    <AppScreen title="Reports" subtitle="View and export shop reports" icon="bar-chart">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {REPORTS.map((report, index) => (
            <View key={report.route}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={report.title}
                onPress={() => navigation.navigate(report.route)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={[styles.icon, { backgroundColor: report.iconBackground }]}>
                  <Ionicons name={report.icon} size={18} color={report.iconColor} />
                </View>
                <View style={styles.copy}>
                  <AppText variant="label" numberOfLines={1}>{report.title}</AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {report.description}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
});
