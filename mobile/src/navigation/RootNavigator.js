import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ErrorView from "../components/ErrorView";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import ShopSetupScreen from "../screens/shop/ShopSetupScreen";
import SplashScreen from "../screens/SplashScreen";
import { colors } from "../theme";
import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";

const SetupStack = createNativeStackNavigator();

function SetupNavigator() {
  return (
    <SetupStack.Navigator screenOptions={{ headerShown: false }}>
      <SetupStack.Screen name="ShopSetup" component={ShopSetupScreen} />
    </SetupStack.Navigator>
  );
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
  },
};

export default function RootNavigator() {
  const { isLoading, isAuthenticated, startupError, retrySession } = useAuth();
  const { hasShop, isLoading: isShopLoading, loadError, fetchShop } = useShop();
  const waitingForShop = isAuthenticated && isShopLoading && !hasShop;

  if (isLoading || waitingForShop) {
    return <SplashScreen />;
  }

  if (startupError) {
    return (
      <ScreenContainer>
        <ErrorView onRetry={retrySession} />
      </ScreenContainer>
    );
  }

  if (isAuthenticated && loadError && !hasShop) {
    return (
      <ScreenContainer>
        <ErrorView title="Unable to load your shop." message={loadError} onRetry={fetchShop} />
      </ScreenContainer>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {!isAuthenticated ? <AuthNavigator /> : hasShop ? <AppNavigator /> : <SetupNavigator />}
    </NavigationContainer>
  );
}
