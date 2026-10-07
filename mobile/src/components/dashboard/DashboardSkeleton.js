import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../../theme";

function Bar({ height, width }) {
  return <View style={[styles.bar, { height, width }]} />;
}

export default function DashboardSkeleton() {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading dashboard">
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerCopy}>
          <Bar height={22} width="80%" />
          <Bar height={16} width="60%" />
          <Bar height={14} width="45%" />
        </View>
      </View>
      <Bar height={18} width="50%" />
      <View style={styles.row}>
        <View style={styles.card} />
        <View style={styles.card} />
      </View>
      <View style={styles.wide} />
      <View style={styles.row}>
        <View style={styles.card} />
        <View style={styles.card} />
      </View>
      <View style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.disabled,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  bar: {
    borderRadius: 8,
    backgroundColor: colors.disabled,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.disabled,
  },
  wide: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.disabled,
  },
  action: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.disabled,
  },
});
