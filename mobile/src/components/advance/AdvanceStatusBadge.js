import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const LABELS = {
  active: "Outstanding",
  closed: "Closed",
  cancelled: "Cancelled",
};

export default function AdvanceStatusBadge({ status }) {
  const label = LABELS[status] || "Advance";
  const closed = status === "closed" || status === "cancelled";
  return (
    <View style={[styles.badge, closed ? styles.closed : styles.open]} accessibilityRole="text" accessibilityLabel={label}>
      <AppText variant="caption" color={closed ? colors.success : colors.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  open: { backgroundColor: colors.disabled },
  closed: { backgroundColor: colors.successBackground },
});
