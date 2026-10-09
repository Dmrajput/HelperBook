import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

function readReport(path, params) {
  return request(async () => {
    const response = await apiClient.get(path, { params });
    return response.data.data;
  });
}

function downloadReport(path, params, fallbackName) {
  return request(async () => {
    const response = await apiClient.get(path, {
      params,
      responseType: "arraybuffer",
      timeout: 30000,
    });
    const disposition = String(response.headers?.["content-disposition"] || "");
    const match = /filename="([^"]+)"/.exec(disposition);
    return {
      filename: match?.[1] || fallbackName,
      bytes: new Uint8Array(response.data),
    };
  });
}

export const getAttendanceReport = (params) => readReport("/reports/attendance", params);
export const getSalaryReport = (params) => readReport("/reports/salary", params);
export const getAdvanceReport = (params) => readReport("/reports/advance", params);
export const getLeaveReport = (params) => readReport("/reports/leave", params);
export const getPaymentReport = (params) => readReport("/reports/payments", params);

export const exportAttendancePdf = (params) => downloadReport("/reports/attendance/pdf", params, "HelperBook_Attendance_Report.pdf");
export const exportAttendanceExcel = (params) => downloadReport("/reports/attendance/excel", params, "HelperBook_Attendance_Report.xlsx");
export const exportSalaryPdf = (params) => downloadReport("/reports/salary/pdf", params, "HelperBook_Salary_Report.pdf");
export const exportSalaryExcel = (params) => downloadReport("/reports/salary/excel", params, "HelperBook_Salary_Report.xlsx");
export const exportAdvancePdf = (params) => downloadReport("/reports/advance/pdf", params, "HelperBook_Advance_Report.pdf");
export const exportAdvanceExcel = (params) => downloadReport("/reports/advance/excel", params, "HelperBook_Advance_Report.xlsx");
export const exportLeavePdf = (params) => downloadReport("/reports/leave/pdf", params, "HelperBook_Leave_Report.pdf");
export const exportLeaveExcel = (params) => downloadReport("/reports/leave/excel", params, "HelperBook_Leave_Report.xlsx");
export const exportPaymentPdf = (params) => downloadReport("/reports/payments/pdf", params, "HelperBook_Payment_Report.pdf");
export const exportPaymentExcel = (params) => downloadReport("/reports/payments/excel", params, "HelperBook_Payment_Report.xlsx");
