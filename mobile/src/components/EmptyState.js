import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme";
import AppText from "./AppText";

export default function EmptyState({ title, message }) {
  return (
    <View style={styles.container}>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" align="center" color={colors.textSecondary}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
});
