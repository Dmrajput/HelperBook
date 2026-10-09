import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { colors, spacing } from "../theme";

export default function MoreScreen() {
  const navigation = useNavigation();
  const { logout, isLoggingOut } = useAuth();
  const { shop } = useShop();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          More
        </AppText>
        {shop?.name ? (
          <AppText variant="body" color={colors.textSecondary}>
            {shop.name}
          </AppText>
        ) : null}
      </View>
      <View style={styles.actions}>
        <AppButton label="Reports" onPress={() => navigation.navigate("Reports")} />
        <AppButton label="Subscription" onPress={() => navigation.navigate("Subscription")} />
        <AppButton label="Shop profile" onPress={() => navigation.navigate("ShopProfile")} />
        <AppButton
          label={isLoggingOut ? "Logging out..." : "Logout"}
          variant="secondary"
          onPress={logout}
          loading={isLoggingOut}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
});
