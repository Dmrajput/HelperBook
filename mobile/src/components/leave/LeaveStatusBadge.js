import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const META = {
  pending: { label: "Pending", color: colors.warning, background: colors.warningBackground },
  approved: { label: "Approved", color: colors.success, background: colors.successBackground },
  rejected: { label: "Rejected", color: colors.error, background: colors.errorBackground },
  cancelled: { label: "Cancelled", color: colors.textSecondary, background: "#F1F5F9" },
};

export default function LeaveStatusBadge({ status }) {
  const meta = META[status] || { label: "Leave", color: colors.textSecondary, background: "#F1F5F9" };
  return (
    <View style={[styles.badge, { backgroundColor: meta.background }]} accessibilityLabel={`Status ${meta.label}`}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <AppText variant="caption" color={meta.color} style={styles.text}>
        {meta.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
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
  text: {
    fontWeight: "700",
    fontSize: 11,
  },
});
