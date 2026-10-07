import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import AddEmployeeScreen from "../screens/employees/AddEmployeeScreen";
import EditEmployeeScreen from "../screens/employees/EditEmployeeScreen";
import EmployeeProfileScreen from "../screens/employees/EmployeeProfileScreen";
import ShopProfileScreen from "../screens/shop/ShopProfileScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MainTabs} />
      <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
      <Stack.Screen name="EmployeeProfile" component={EmployeeProfileScreen} />
      <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} />
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
    </Stack.Navigator>
  );
}
