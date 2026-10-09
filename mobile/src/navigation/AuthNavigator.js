import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import OtpVerificationScreen from "../screens/OtpVerificationScreen";
import EmployeeLoginScreen from "../screens/employeeAuth/EmployeeLoginScreen";
import EmployeeOtpScreen from "../screens/employeeAuth/EmployeeOtpScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
      <Stack.Screen name="EmployeeOtp" component={EmployeeOtpScreen} />
    </Stack.Navigator>
  );
}
