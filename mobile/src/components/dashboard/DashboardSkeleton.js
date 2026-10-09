import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme";

export default function DashboardSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading dashboard">
      <View style={styles.row}>
        <View style={styles.tile} />
        <View style={styles.tile} />
        <View style={styles.tile} />
        <View style={styles.tile} />
      </View>
      <View style={styles.wide} />
      <View style={styles.row}>
        <View style={styles.card} />
        <View style={styles.card} />
      </View>
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
    height: 108,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  card: {
    flex: 1,
    height: 132,
    borderRadius: 18,
    backgroundColor: colors.disabled,
  },
  wide: {
    height: 140,
    borderRadius: 18,
    backgroundColor: colors.disabled,
  },
});