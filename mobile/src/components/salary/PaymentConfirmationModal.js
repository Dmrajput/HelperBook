import { Alert } from "react-native";
import { methodLabel } from "../../constants/salaryPayment";
import { formatAttendanceDate } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

export function confirmSalaryPayment({ employeeName, amount, method, date, reference, onConfirm }) {
  const referenceLine = reference ? `\n\nReference:\n${reference}` : "\n\nReference:\nNone";
  Alert.alert(
    "Confirm Salary Payment",
    `You are recording a payment of ${formatInr(amount)} for ${employeeName}.\n\nMethod:\n${methodLabel(method)}\n\nDate:\n${formatAttendanceDate(date)}${referenceLine}\n\nOnce recorded, the salary will be marked as PAID.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm Payment", onPress: onConfirm },
    ]
  );
}
