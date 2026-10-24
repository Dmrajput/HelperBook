import { StyleSheet } from "react-native";
import AppText from "../components/AppText";
import BrandLogo from "../components/BrandLogo";
import ScreenContainer from "../components/ScreenContainer";
import { APP_TAGLINE } from "../constants/app";
import { colors, spacing } from "../theme";

export default function SplashScreen() {
  return (
    <ScreenContainer centered>
      <BrandLogo size={148} style={styles.logo} />
      <AppText variant="subtitle" align="center" color={colors.textSecondary}>
        {APP_TAGLINE}
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    marginBottom: spacing.lg,
    borderRadius: 28,
  },
});
