import { StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function ReportEmptyState({ title, message }) {
  return (
    <View style={styles.box}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, paddingVertical: spacing.lg },
});
