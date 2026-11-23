import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import { colors, spacing } from "../../theme";

const REPORTS = [
  {
    route: "AttendanceReport",
    title: "Attendance",
    description: "How staff attended",
    icon: "calendar-outline",
    iconColor: "#3B6FE0",
    iconBackground: "#EEF3FF",
  },
  {
    route: "SalaryReport",
    title: "Salary",
    description: "Calculated pay for the period",
    icon: "wallet-outline",
    iconColor: colors.success,
    iconBackground: colors.successBackground,
  },
  {
    route: "AdvanceReport",
    title: "Advance / Khata",
    description: "Money given and repaid",
    icon: "book-outline",
    iconColor: colors.secondary,
    iconBackground: colors.secondaryLight,
  },
  {
    route: "LeaveReport",
    title: "Leave",
    description: "Approved and pending leave",
    icon: "sunny-outline",
    iconColor: "#EA580C",
    iconBackground: "#FFF7ED",
  },
  {
    route: "PaymentReport",
    title: "Payments",
    description: "Salary already paid",
    icon: "cash-outline",
    iconColor: "#D4535E",
    iconBackground: "#FDECEC",
  },
];

export default function ReportsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Reports
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              View and export shop reports
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="bar-chart-outline" size={20} color="#DB2777" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <AppText variant="label" style={styles.introTitle}>
            Choose a report
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Open a report to filter by date and export.
          </AppText>
        </View>

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
                  <AppText variant="label" numberOfLines={1} style={styles.rowTitle}>
                    {report.title}
                  </AppText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intro: {
    gap: 4,
  },
  introTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 68,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
});
