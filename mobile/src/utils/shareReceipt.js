import { Linking } from "react-native";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { formatAttendanceDate, formatMonth } from "./attendanceFormat";
import { formatInr } from "./dashboardFormat";

const SHARE_ERROR = "Unable to share the receipt.\n\nThe PDF has been generated. You can try sharing again.";

export function receiptShareMessage(receipt) {
  const name = receipt?.employee?.name || "there";
  const period = receipt?.period ? formatMonth(receipt.period.year, receipt.period.month) : "this period";
  const amount = formatInr(receipt?.finalSalary);
  const method = receipt?.payment?.methodLabel || "";
  const date = receipt?.payment?.paymentDate ? formatAttendanceDate(receipt.payment.paymentDate) : "";
  return `Hello ${name},\n\nYour salary for ${period} has been paid.\n\nAmount: ${amount}\nPayment Method: ${method}\nPayment Date: ${date}\n\nYour salary receipt is available to share with this message.\n\nThank you.`;
}

export async function saveReceiptFile(bytes, filename) {
  const safeName = String(filename || "HelperBook_Salary_Receipt.pdf").replace(/[^\w.-]/g, "_");
  const file = new File(Paths.cache, safeName);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(bytes);
  return file;
}

export async function shareReceiptFile(file) {
  const available = await Sharing.isAvailableAsync();
  if (!available || !file?.uri) {
    throw new Error(SHARE_ERROR);
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Share PDF",
    UTI: "com.adobe.pdf",
  });
}

export async function whatsAppAvailable() {
  try {
    return await Linking.canOpenURL("whatsapp://send");
  } catch {
    return false;
  }
}

export const WHATSAPP_UNAVAILABLE = "WhatsApp is not available on this device.\nYou can use Share PDF instead.";
