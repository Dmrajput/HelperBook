import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function TeamCard({ active, inactive, attendance, onAdd, onPressEmployees }) {
  const total = Math.max(Number(active) || 0, 0);
  const marked =
    (Number(attendance?.presentToday) || 0)
    + (Number(attendance?.absentToday) || 0)
    + (Number(attendance?.halfDayToday) || 0)
    + (Number(attendance?.leaveToday) || 0);
  const noEmployees = total === 0 && (Number(inactive) || 0) === 0;

  if (noEmployees) {
    return (
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
        </View>
        <AppText variant="label" style={styles.title}>
          Set up your team
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Add your first employee to start attendance, salary, and advances.
        </AppText>
        <View style={styles.checklist}>
          <CheckRow label="Add employee details" />
          <CheckRow label="Mark today's attendance" muted />
          <CheckRow label="Process salary when ready" muted />
        </View>
        <AppButton label="+ Add your first employee" onPress={onAdd} />
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={styles.card}>
        <AppText variant="label" style={styles.title}>
          No active employees
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {`${inactive} inactive employee${inactive === 1 ? "" : "s"} on file. Reactivate someone or add a new employee to use attendance and salary.`}
        </AppText>
        <AppButton label="+ Add employee" onPress={onAdd} />
        <AppButton label="View employees" variant="secondary" onPress={onPressEmployees} />
      </View>
    );
  }

  const complete = (Number(attendance?.notMarkedToday) || 0) === 0 && attendance?.isWorkingDay !== false;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={20} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.textSecondary}>
            Your team today
          </AppText>
          <AppText style={styles.metric}>{`${Math.min(marked, total)}/${total}`}</AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {inactive > 0
              ? `${total} active · ${inactive} inactive`
              : `${total} active employee${total === 1 ? "" : "s"}`}
          </AppText>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, complete ? styles.badgeOk : styles.badgeWarn]}>
            <Ionicons
              name={complete ? "checkmark" : "alert"}
              size={11}
              color={complete ? colors.success : colors.warning}
            />
            <AppText
              variant="caption"
              color={complete ? colors.success : colors.warning}
              style={styles.badgeText}
              numberOfLines={1}
            >
              {complete ? "All marked" : "Needs marking"}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View employees"
            onPress={onPressEmployees}
            style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}
          >
            <AppText variant="caption" color={colors.primary} style={styles.viewLabel}>
              View employees ›
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CheckRow({ label, muted = false }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={muted ? "ellipse-outline" : "checkmark-circle"}
        size={14}
        color={muted ? colors.placeholder : colors.primary}
      />
      <AppText variant="caption" color={muted ? colors.textSecondary : colors.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
  },
  checklist: {
    gap: 4,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  metric: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeOk: {
    backgroundColor: colors.successBackground,
  },
  badgeWarn: {
    backgroundColor: colors.warningBackground,
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 11,
  },
  viewButton: {
    minHeight: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  viewLabel: {
    fontWeight: "700",
    fontSize: 11,
  },
  pressed: {
    opacity: 0.88,
  },
});
