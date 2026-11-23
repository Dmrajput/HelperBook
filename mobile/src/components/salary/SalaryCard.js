import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

function statusMeta(status, paymentStatus) {
  if (!status) {
    return { label: "Not calculated", color: colors.textSecondary, background: "#F1F5F9" };
  }
  if (status === "draft") {
    return { label: "Draft", color: colors.warning, background: colors.warningBackground };
  }
  if (status === "finalized" && paymentStatus === "paid") {
    return { label: "Paid", color: colors.success, background: colors.successBackground };
  }
  if (status === "finalized") {
    return { label: "Unpaid", color: colors.error, background: colors.errorBackground };
  }
  return { label: "Finalized", color: colors.success, background: colors.successBackground };
}

export default function SalaryCard({
  name,
  role,
  amount,
  status,
  paymentStatus,
  actionLabel,
  onPress,
  disabled,
}) {
  const initial = String(name || "E").trim().charAt(0).toUpperCase();
  const badge = statusMeta(status, paymentStatus);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${actionLabel}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && !disabled && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.avatar}>
          <AppText variant="label" color={colors.primary} style={styles.avatarLetter}>
            {initial}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="label" style={styles.name} numberOfLines={1}>
            {name}
          </AppText>
          {role ? (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {role}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <View style={[styles.dot, { backgroundColor: badge.color }]} />
          <AppText variant="caption" color={badge.color} style={styles.badgeText}>
            {badge.label}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottom}>
        <View style={styles.amountBlock}>
          <AppText variant="caption" color={colors.textSecondary}>
            Net salary
          </AppText>
          <AppText variant="label" style={styles.amount} numberOfLines={1}>
            {amount == null ? "Not calculated" : formatInr(amount)}
          </AppText>
        </View>
        <View style={styles.actionChip}>
          <AppText variant="caption" color={colors.primary} style={styles.actionText}>
            {actionLabel}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 11,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  amountBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  amount: {
    fontWeight: "800",
    fontSize: 16,
  },
  actionChip: {
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontWeight: "700",
  },
});
