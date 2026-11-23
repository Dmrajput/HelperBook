import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import SectionHeader from "./SectionHeader";
import { methodLabel } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, shiftKey, todayKey } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";
import { roleLabel } from "../../utils/employeeFormat";

function paymentWhen(key) {
  if (!key) return "";
  if (key === todayKey()) return "Today";
  if (key === shiftKey(todayKey(), -1)) return "Yesterday";
  return formatAttendanceDate(key);
}

export default function RecentActivity({
  recentPayments = [],
  recentEmployees = [],
  pendingLeave = 0,
  onPressPayment,
  onPressEmployee,
  onPressLeave,
  onViewPayments,
}) {
  const items = [];

  if (pendingLeave > 0) {
    items.push({
      id: "pending-leave",
      title: "Pending leave",
      subtitle: `${pendingLeave} request${pendingLeave === 1 ? "" : "s"} to review`,
      meta: "Review",
      icon: "calendar-outline",
      color: colors.warning,
      background: colors.warningBackground,
      onPress: onPressLeave,
    });
  }

  for (const payment of recentPayments.slice(0, 3)) {
    items.push({
      id: `pay-${payment.id}`,
      title: "Salary paid",
      subtitle: `${payment.employeeName} · ${methodLabel(payment.paymentMethod)}`,
      amount: formatInr(payment.amount),
      meta: paymentWhen(payment.paymentDate),
      icon: "wallet-outline",
      color: colors.primary,
      background: colors.primaryLight,
      onPress: () => onPressPayment(payment),
    });
  }

  if (items.length < 4) {
    for (const employee of recentEmployees.slice(0, 4 - items.length)) {
      items.push({
        id: `emp-${employee.id}`,
        title: employee.name,
        subtitle: `${roleLabel(employee)} · Employee record updated`,
        meta: "Recently",
        icon: "person-outline",
        color: colors.primary,
        background: colors.primaryLight,
        onPress: () => onPressEmployee(employee),
      });
    }
  }

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Recent activity"
        actionLabel={recentPayments.length ? "View all ›" : undefined}
        onAction={recentPayments.length ? onViewPayments : undefined}
      />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={20} color={colors.placeholder} />
          <AppText variant="caption" color={colors.textSecondary} align="center">
            Salary payments, leave requests and employee updates appear here when available.
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
              onPress={item.onPress}
              style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
            >
              <View style={[styles.icon, { backgroundColor: item.background }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <View style={styles.copy}>
                <AppText variant="label" numberOfLines={1} style={styles.title}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {item.subtitle}
                </AppText>
              </View>
              <View style={styles.meta}>
                {item.amount ? (
                  <AppText variant="label" numberOfLines={1} style={styles.amount}>
                    {item.amount}
                  </AppText>
                ) : null}
                {item.meta ? (
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {item.meta}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
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
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    alignItems: "flex-end",
    gap: 2,
    maxWidth: "34%",
  },
  amount: {
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
  },
});
