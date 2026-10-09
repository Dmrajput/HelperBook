import { getSalaryReceipt, getSalaryReceiptPdf } from "../services/salaryReceipt.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { parseSalaryId } from "../validators/salary.validator.js";

export async function getReceipt(req, res) {
  const data = await getSalaryReceipt(req.user.id, parseSalaryId(req.params.id));
  sendSuccess(res, "Salary receipt fetched successfully", data);
}

export async function getReceiptPdf(req, res) {
  const { filename, buffer } = await getSalaryReceiptPdf(req.user.id, parseSalaryId(req.params.id));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(buffer);
}
