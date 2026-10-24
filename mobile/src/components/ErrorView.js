import { StyleSheet, View } from "react-native";
import { CONNECTION_ERROR_BODY, CONNECTION_ERROR_TITLE } from "../constants/app";
import { colors, spacing } from "../theme";
import AppButton from "./AppButton";
import AppText from "./AppText";

export default function ErrorView({
  title = CONNECTION_ERROR_TITLE,
  message = CONNECTION_ERROR_BODY,
  onRetry,
}) {
  return (
    <View style={styles.container}>
      {title ? (
        <AppText variant="label" color={colors.error}>
          {title}
        </AppText>
      ) : null}
      {message ? (
        <AppText variant="caption" color={colors.text}>
          {message}
        </AppText>
      ) : null}
      {onRetry ? <AppButton label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.errorBackground,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
