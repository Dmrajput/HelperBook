import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function AttendanceSummary({ summary }) {
  if (!summary) {
    return null;
  }

  const items = [
    ["Present", summary.present],
    ["Absent", summary.absent],
    ["Half Day", summary.halfDay],
    ["Leave", summary.leave],
  ];

  return (
    <View style={styles.wrap}>
      {summary.total === undefined || summary.total === null ? null : (
        <AppText variant="body">{summary.total} Employees</AppText>
      )}
      <View style={styles.row}>
        {items.map(([label, value]) => (
          <View key={label} style={styles.item}>
            <AppText variant="caption" color={colors.textSecondary}>
              {label}
            </AppText>
            <AppText variant="label">{value ?? 0}</AppText>
          </View>
        ))}
      </View>
      {summary.notMarked === undefined ? null : (
        <AppText variant="caption" color={colors.textSecondary}>
          Not Marked: {summary.notMarked}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  item: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
