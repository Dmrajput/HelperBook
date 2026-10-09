import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function LeaveEmptyState({ title, message }) {
  return (
    <View style={styles.wrap}>
      <AppText variant="subtitle">{title}</AppText>
      {message ? (
        <AppText variant="body" color={colors.textSecondary}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingVertical: spacing.lg },
});
