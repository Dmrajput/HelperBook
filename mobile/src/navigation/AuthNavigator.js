import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import EmployeeForgotPasswordScreen from "../screens/employeeAuth/EmployeeForgotPasswordScreen";
import EmployeeLoginScreen from "../screens/employeeAuth/EmployeeLoginScreen";
import EmployeeResetPasswordScreen from "../screens/employeeAuth/EmployeeResetPasswordScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="EmployeeLogin" component={EmployeeLoginScreen} />
      <Stack.Screen name="EmployeeForgotPassword" component={EmployeeForgotPasswordScreen} />
      <Stack.Screen name="EmployeeResetPassword" component={EmployeeResetPasswordScreen} />
    </Stack.Navigator>
  );
}
