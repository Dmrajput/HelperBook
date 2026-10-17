import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme";

export default function DashboardSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading dashboard">
      <View style={styles.wide} />
      <View style={styles.row}>
        <View style={styles.tile} />
        <View style={styles.tile} />
        <View style={styles.tile} />
      </View>
      <View style={styles.row}>
        <View style={styles.card} />
        <View style={styles.card} />
      </View>
      <View style={styles.wideShort} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    height: 96,
    borderRadius: 14,
    backgroundColor: colors.disabled,
  },
  card: {
    flex: 1,
    height: 128,
    borderRadius: 14,
    backgroundColor: colors.disabled,
  },
  wide: {
    height: 160,
    borderRadius: 14,
    backgroundColor: colors.disabled,
  },
  wideShort: {
    height: 88,
    borderRadius: 14,
    backgroundColor: colors.disabled,
  },
});
