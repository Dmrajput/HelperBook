import { StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function AttendanceEmptyState({ title, message, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{title}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {message}
      </AppText>
      {actionLabel ? <AppButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
