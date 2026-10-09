import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

const PDF_ERROR = "Unable to generate PDF report. Please try again.";
const EXCEL_ERROR = "Unable to generate Excel report. Please try again.";

export async function shareDownloadedReport(fileResult, kind) {
  if (!fileResult?.bytes) {
    throw new Error(kind === "pdf" ? PDF_ERROR : EXCEL_ERROR);
  }
  const safeName = String(fileResult.filename || "HelperBook_Report").replace(/[^\w.-]/g, "_");
  const file = new File(Paths.cache, safeName);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(fileResult.bytes);
  const available = await Sharing.isAvailableAsync();
  if (!available || !file.uri) {
    throw new Error(kind === "pdf" ? PDF_ERROR : EXCEL_ERROR);
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: kind === "pdf" ? "Share PDF" : "Share Excel",
    UTI: kind === "pdf" ? "com.adobe.pdf" : "org.openxmlformats.spreadsheetml.sheet",
  });
}

export { PDF_ERROR, EXCEL_ERROR };
