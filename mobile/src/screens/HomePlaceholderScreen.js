import { StyleSheet, View } from "react-native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import ScreenContainer from "../components/ScreenContainer";
import { HOME_MESSAGE, HOME_TITLE } from "../constants/app";
import { useDevPreview } from "../context/devPreviewContext";
import { colors, spacing } from "../theme";

export default function HomePlaceholderScreen() {
  const { closeAppPreview } = useDevPreview();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          {HOME_TITLE}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {HOME_MESSAGE}
        </AppText>
      </View>
      {__DEV__ ? (
        <AppButton label="Back to login" variant="secondary" onPress={closeAppPreview} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.xxl,
  },
});
