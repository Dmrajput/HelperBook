import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

const AVATAR_TONES = [
  { background: colors.primaryLight, color: colors.primary },
  { background: colors.secondaryLight, color: colors.secondary },
  { background: colors.successBackground, color: colors.success },
  { background: colors.infoBackground, color: colors.info },
  { background: colors.warningBackground, color: colors.warning },
];

function avatarTone(name = "") {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index) * (index + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash];
}

function statusMeta(status, paymentStatus) {
  if (!status) {
    return { label: "Not calculated", color: colors.textSecondary, background: colors.disabled, icon: "ellipse-outline" };
  }
  if (status === "draft") {
    return { label: "Draft", color: colors.warning, background: colors.warningBackground, icon: "time-outline" };
  }
  if (status === "finalized" && paymentStatus === "paid") {
    return { label: "Paid", color: colors.success, background: colors.successBackground, icon: "checkmark-circle" };
  }
  if (status === "finalized") {
    return { label: "Unpaid", color: colors.error, background: colors.errorBackground, icon: "hourglass-outline" };
  }
  return { label: "Finalized", color: colors.success, background: colors.successBackground, icon: "checkmark-circle" };
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
  const tone = avatarTone(name);
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
        <View style={[styles.avatar, { backgroundColor: tone.background }]}>
          <AppText variant="label" color={tone.color} style={styles.avatarLetter}>
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
          <AppText variant="subtitle" style={styles.amount} numberOfLines={1}>
            {amount == null ? "Not calculated" : formatInr(amount)}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            Basic • Allowances • Deductions • Advances
          </AppText>
        </View>
        <View style={styles.side}>
          <View style={[styles.badge, { backgroundColor: badge.background }]}>
            <Ionicons name={badge.icon} size={12} color={badge.color} />
            <AppText variant="caption" color={badge.color} style={styles.badgeText}>
              {badge.label}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
        </View>
      </View>
      <View style={styles.actionRow}>
        <View style={styles.actionChip}>
          <AppText variant="label" color={colors.primary}>
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
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.92,
  },
  top: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontWeight: "700",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: "700",
  },
  amount: {
    fontWeight: "700",
    marginTop: 2,
  },
  side: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontWeight: "700",
  },
  actionRow: {
    alignItems: "flex-end",
  },
  actionChip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: "center",
  },
});
