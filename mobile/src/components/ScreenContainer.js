import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import theme, { colors, spacing } from "../theme";

export default function ScreenContainer({ children, style, centered = false, edges }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.content, centered && styles.centered, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.screenPadding,
    paddingVertical: spacing.md,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});
