import apiClient from "../api/apiClient";
import { toApiError } from "../utils/apiError";

async function request(work) {
  try {
    return await work();
  } catch (error) {
    throw toApiError(error);
  }
}

export function getSalaryReceipt(salaryId) {
  return request(async () => {
    const response = await apiClient.get(`/salaries/${salaryId}/receipt`);
    return response.data.data;
  });
}

export function getSalaryReceiptPdf(salaryId) {
  return request(async () => {
    const response = await apiClient.get(`/salaries/${salaryId}/receipt/pdf`, {
      responseType: "arraybuffer",
      timeout: 30000,
    });
    const disposition = String(response.headers?.["content-disposition"] || "");
    const match = /filename="([^"]+)"/.exec(disposition);
    return {
      filename: match?.[1] || "HelperBook_Salary_Receipt.pdf",
      bytes: new Uint8Array(response.data),
    };
  });
}
