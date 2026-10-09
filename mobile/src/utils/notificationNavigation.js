import { Alert } from "react-native";

let queued = null;

export function queueNotificationNavigation(data) {
  queued = data || null;
}

export function consumeQueuedNotification() {
  const value = queued;
  queued = null;
  return value;
}

export function navigateFromNotification(navigation, source, role) {
  const type = source?.type;
  const data = source?.data || source || {};
  const entityType = source?.entityType || data.entityType;
  if (role === "employee") {
    if (type === "salary_paid" || entityType === "salary") {
      const salaryId = data.salaryId || source?.entityId;
      if (salaryId) navigation.navigate("EmployeeSalaryDetail", { salaryId });
      return;
    }
    if (entityType === "leave" || String(type || "").startsWith("leave_")) {
      const leaveId = data.entityId || source?.entityId;
      if (leaveId) navigation.navigate("EmployeeLeaveDetail", { leaveId });
      return;
    }
    return;
  }
  if (type === "salary_reminder") {
    navigation.navigate("Salary", { paymentFilter: "unpaid" });
    return;
  }
  if (type === "salary_paid" || entityType === "salary") {
    const salaryId = data.salaryId || source?.entityId;
    if (!salaryId) {
      Alert.alert("Notifications", "This item is no longer available.");
      return;
    }
    navigation.navigate("SalaryDetail", { salaryId });
    return;
  }
  if (entityType === "leave" || String(type || "").startsWith("leave_")) {
    const leaveId = data.entityId || source?.entityId;
    if (!leaveId) {
      Alert.alert("Notifications", "This item is no longer available.");
      return;
    }
    navigation.navigate("LeaveDetail", { leaveId });
    return;
  }
  if (entityType === "subscription" || String(type || "").startsWith("subscription_")) {
    navigation.navigate("Subscription");
    return;
  }
  Alert.alert("Notifications", "This item is no longer available.");
}
