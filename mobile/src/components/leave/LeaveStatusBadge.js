import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function LeaveStatusBadge({ status }) {
  const label = LABEL[status] || "Leave";
  const tone = status === "approved" ? styles.approved : status === "rejected" ? styles.rejected : styles.neutral;
  const textColor = status === "approved" ? colors.success : status === "rejected" ? colors.error : colors.text;
  return (
    <View style={[styles.badge, tone]} accessibilityLabel={`Status ${label}`}>
      <AppText variant="caption" color={textColor}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  approved: { backgroundColor: colors.successBackground, borderColor: colors.success },
  rejected: { backgroundColor: colors.errorBackground, borderColor: colors.error },
  neutral: { backgroundColor: colors.surface, borderColor: colors.border },
});
