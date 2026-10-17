import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ErrorView from "../components/ErrorView";
import ScreenContainer from "../components/ScreenContainer";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import ShopSetupScreen from "../screens/shop/ShopSetupScreen";
import SplashScreen from "../screens/SplashScreen";
import { colors } from "../theme";
import EmployeeChangePasswordScreen from "../screens/employeeAuth/EmployeeChangePasswordScreen";
import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";
import EmployeeNavigator from "./EmployeeNavigator";

const SetupStack = createNativeStackNavigator();
const ForcedPasswordStack = createNativeStackNavigator();

function SetupNavigator() {
  return (
    <SetupStack.Navigator screenOptions={{ headerShown: false }}>
      <SetupStack.Screen name="ShopSetup" component={ShopSetupScreen} />
    </SetupStack.Navigator>
  );
}

function ForcedPasswordNavigator() {
  return (
    <ForcedPasswordStack.Navigator screenOptions={{ headerShown: false }}>
      <ForcedPasswordStack.Screen
        name="EmployeeChangePassword"
        component={EmployeeChangePasswordScreen}
        initialParams={{ forced: true }}
      />
    </ForcedPasswordStack.Navigator>
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
  const { isLoading, isAuthenticated, startupError, retrySession, user } = useAuth();
  const { hasShop, isLoading: isShopLoading, loadError, fetchShop } = useShop();
  const isEmployee = user?.role === "employee";
  const waitingForShop = isAuthenticated && !isEmployee && isShopLoading && !hasShop;

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

  if (isAuthenticated && !isEmployee && loadError && !hasShop) {
    return (
      <ScreenContainer>
        <ErrorView title="Unable to load your shop." message={loadError} onRetry={fetchShop} />
      </ScreenContainer>
    );
  }

  const mustChangePassword = isEmployee && Boolean(user?.mustChangePassword);

  return (
    <NavigationContainer theme={navigationTheme}>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : mustChangePassword ? (
        <ForcedPasswordNavigator />
      ) : isEmployee ? (
        <EmployeeNavigator />
      ) : hasShop ? (
        <AppNavigator />
      ) : (
        <SetupNavigator />
      )}
    </NavigationContainer>
  );
}
