import { StyleSheet, View } from "react-native";
import AppText from "../components/AppText";
import ScreenContainer from "../components/ScreenContainer";
import { APP_NAME, APP_TAGLINE } from "../constants/app";
import { colors, spacing } from "../theme";

export default function SplashScreen() {
  return (
    <ScreenContainer centered>
      {/* Replace this wordmark with the HelperBook logo when the asset is ready. */}
      <View style={styles.logoSlot}>
        <AppText variant="title" align="center" accessibilityRole="header">
          {APP_NAME}
        </AppText>
      </View>
      <AppText variant="subtitle" align="center" color={colors.textSecondary}>
        {APP_TAGLINE}
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logoSlot: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
