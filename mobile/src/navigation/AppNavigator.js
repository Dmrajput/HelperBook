import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomePlaceholderScreen from "../screens/HomePlaceholderScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomePlaceholderScreen} />
    </Stack.Navigator>
  );
}
