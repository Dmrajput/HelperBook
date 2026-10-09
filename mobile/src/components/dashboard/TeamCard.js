import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const LEGEND = [
  { key: "presentToday", label: "Present", color: "#1C8A52" },
  { key: "absentToday", label: "Absent", color: "#D4535E" },
  { key: "notMarkedToday", label: "Not Marked", color: "#C8881A" },
  { key: "leaveToday", label: "On Leave", color: "#4C6FE0" },
];

function ringColors(percent) {
  const track = "#E5F5EE";
  const fill = colors.primary;
  const p = Math.max(0, Math.min(100, percent));
  return {
    borderTopColor: p > 0 ? fill : track,
    borderRightColor: p > 25 ? fill : track,
    borderBottomColor: p > 50 ? fill : track,
    borderLeftColor: p > 75 ? fill : track,
  };
}

export default function TeamCard({ active, inactive, attendance, onPress, onAdd }) {
  const total = Math.max(active, 0);
  const counts = LEGEND.map((item) => Number(attendance?.[item.key]) || 0);
  const largest = Math.max(...counts, 0);
  const percent = total === 0 ? 0 : Math.round((largest / total) * 100);
  const noEmployees = total === 0 && inactive === 0;

  return (
    <View style={styles.section}>
      <AppText variant="subtitle" style={styles.title}>Your Team</AppText>
      {noEmployees ? (
        <View style={[styles.card, styles.empty]}>
          <AppText variant="label">No employees yet</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Add your first employee to start managing your team.
          </AppText>
          <AppButton label="+ Add Employee" onPress={onAdd} />
        </View>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={`Total employees, ${total}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.left}>
            <View style={styles.people}>
              <Ionicons name="people" size={18} color={colors.primary} />
            </View>
            <AppText variant="caption" color={colors.textSecondary}>Total Employees</AppText>
            <AppText variant="heading">{String(total)}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {inactive > 0 ? `Active staff · ${inactive} inactive` : "Active staff"}
            </AppText>
          </View>
          <View style={styles.right}>
            <View style={[styles.ring, ringColors(percent)]}>
              <View style={styles.hole}>
                <AppText variant="label">{`${percent}%`}</AppText>
              </View>
            </View>
            <View style={styles.legend}>
              {LEGEND.map((item) => (
                <View key={item.key} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <AppText variant="caption" style={styles.legendLabel} numberOfLines={1}>{item.label}</AppText>
                  <AppText variant="caption">{String(attendance?.[item.key] ?? 0)}</AppText>
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      )}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#12382C",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  left: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  people: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ring: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-45deg" }],
  },
  hole: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  legend: {
    gap: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendLabel: {
    width: 72,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  empty: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  pressed: {
    opacity: 0.92,
  },
});
