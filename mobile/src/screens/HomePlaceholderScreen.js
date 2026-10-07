import { StyleSheet, View } from "react-native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import ScreenContainer from "../components/ScreenContainer";
import { HOME_MESSAGE, HOME_TITLE } from "../constants/app";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { colors, spacing } from "../theme";
import { businessLabel, formatTime, formatWorkingDays } from "../utils/shopFormat";

export default function HomePlaceholderScreen({ navigation }) {
  const { logout, isLoggingOut } = useAuth();
  const { shop } = useShop();
  const hours = shop
    ? `${formatTime(shop.workingSchedule.startTime)} – ${formatTime(shop.workingSchedule.endTime)}`
    : "";

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="heading" accessibilityRole="header">
          {HOME_TITLE}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {HOME_MESSAGE}
        </AppText>
        {shop ? (
          <View style={styles.shop}>
            <AppText variant="subtitle">{shop.name}</AppText>
            <AppText variant="body">{businessLabel(shop)}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {shop.address.city}, {shop.address.state}
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {formatWorkingDays(shop.workingSchedule.workingDays)} · {hours}
            </AppText>
            <AppText variant="body">Currency ₹</AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <AppButton label="Employees" onPress={() => navigation.navigate("EmployeeList")} />
        <AppButton label="Shop profile" variant="secondary" onPress={() => navigation.navigate("ShopProfile")} />
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
    paddingTop: spacing.xxl,
  },
  shop: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
});
