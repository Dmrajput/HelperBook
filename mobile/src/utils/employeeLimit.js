import { Alert } from "react-native";

export function showEmployeeLimitAlert(navigation, error) {
  const details = error?.details || {};
  const planName = details.planName || "current";
  const limit = details.limit;
  const message = limit
    ? `Your ${planName} plan allows ${limit} active employees.\n\nUpgrade your plan to add more employees.`
    : error?.message || "Upgrade your plan to add more employees.";
  Alert.alert("Employee limit reached", message, [
    { text: "Cancel", style: "cancel" },
    { text: "View Plans", onPress: () => navigation.navigate("Subscription") },
  ]);
}
