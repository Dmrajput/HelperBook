import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { formatInr } from "../utils/currency.js";

const fontDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../assets/fonts");
const regularFont = path.join(fontDir, "NotoSans-Regular.ttf");
const boldFont = path.join(fontDir, "NotoSans-Bold.ttf");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function clean(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || "")) return "";
  const [year, month, day] = key.split("-").map(Number);
  const monthName = MONTHS[month - 1];
  if (!monthName) return "";
  return `${String(day).padStart(2, "0")} ${monthName} ${year}`;
}

function row(doc, label, value, options = {}) {
  const text = clean(value);
  if (!text) return;
  const y = doc.y;
  doc.font(options.strong ? "NotoBold" : "Noto").fontSize(options.strong ? 13 : 11).fillColor("#1C1917");
  doc.text(clean(label), 48, y, { width: 280, lineBreak: false });
  doc.text(text, 330, y, { width: 217, align: "right", lineBreak: false });
  doc.y = y + (options.strong ? 24 : 18);
}

function heading(doc, title) {
  doc.moveDown(0.7);
  doc.font("NotoBold").fontSize(11).fillColor("#146C54").text(clean(title), 48, doc.y, { width: 499 });
  const line = doc.y + 4;
  doc.strokeColor("#E7E2D8").lineWidth(1).moveTo(48, line).lineTo(547, line).stroke();
  doc.y = line + 10;
  doc.fillColor("#1C1917");
}

export function buildSalaryReceiptPdf(view, logo) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, compress: false });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("Noto", readFileSync(regularFont));
    doc.registerFont("NotoBold", readFileSync(boldFont));

    if (logo) {
      try {
        doc.image(logo, 265, 42, { fit: [64, 64], align: "center" });
        doc.y = 116;
      } catch {
        doc.y = 48;
      }
    }

    doc.font("NotoBold").fontSize(18).fillColor("#146C54").text("HelperBook", { align: "center" });
    doc.moveDown(0.2);
    doc.font("Noto").fontSize(10).fillColor("#57534E").text("Simple Staff Management for Small Businesses", { align: "center" });
    doc.moveDown(0.8);
    doc.font("NotoBold").fontSize(16).fillColor("#1C1917").text("SALARY RECEIPT", { align: "center" });
    doc.moveDown(0.6);
    row(doc, "Receipt No", view.receipt.receiptNumber);
    row(doc, "Payment Date", formatDate(view.receipt.receiptDate));

    heading(doc, "Shop");
    doc.font("NotoBold").fontSize(13).text(clean(view.shop.name) || "Shop", 48, doc.y, { width: 499 });
    doc.moveDown(0.2);
    for (const line of [view.shop.businessType, view.shop.ownerName ? `Owner: ${view.shop.ownerName}` : "", view.shop.phone ? `Phone: ${view.shop.phone}` : "", view.shop.email, ...(view.shop.addressLines || [])]) {
      const text = clean(line);
      if (!text) continue;
      doc.font("Noto").fontSize(11).fillColor("#1C1917").text(text, 48, doc.y, { width: 499 });
    }

    heading(doc, "Employee");
    doc.font("NotoBold").fontSize(13).text(clean(view.employee.name) || "Employee", 48, doc.y, { width: 499 });
    doc.moveDown(0.2);
    for (const line of [view.employee.role, view.employee.phone, view.employee.joiningDate ? `Joined: ${formatDate(view.employee.joiningDate)}` : ""]) {
      const text = clean(line);
      if (!text) continue;
      doc.font("Noto").fontSize(11).text(text, 48, doc.y, { width: 499 });
    }

    heading(doc, "Salary Period");
    doc.font("Noto").fontSize(11).text(`${formatDate(view.period.startDate)} – ${formatDate(view.period.endDate)}`, 48, doc.y, { width: 499 });

    heading(doc, "Attendance");
    const attendance = view.attendance || {};
    row(doc, "Working Days", String(attendance.workingDays ?? 0));
    row(doc, "Present", String(attendance.presentDays ?? 0));
    row(doc, "Half Days", String(attendance.halfDays ?? 0));
    row(doc, "Absent", String(attendance.absentDays ?? 0));
    row(doc, "Leave", String(attendance.leaveDays ?? 0));
    if (Number(attendance.paidLeaveDays) > 0) row(doc, "Paid Leave", `${attendance.paidLeaveDays} days`);
    if (Number(attendance.unpaidLeaveDays) > 0) row(doc, "Unpaid Leave", `${attendance.unpaidLeaveDays} days`);

    heading(doc, "Salary Breakdown");
    for (const line of view.lines || []) {
      row(doc, line.label, formatInr(line.amount));
    }
    doc.moveDown(0.3);
    const rule = doc.y;
    doc.strokeColor("#146C54").lineWidth(1.5).moveTo(48, rule).lineTo(547, rule).stroke();
    doc.y = rule + 8;
    row(doc, "FINAL SALARY", formatInr(view.finalSalary), { strong: true });

    heading(doc, "Payment");
    row(doc, "Status", "PAID");
    row(doc, "Amount", formatInr(view.payment.amount));
    row(doc, "Method", view.payment.methodLabel);
    row(doc, "Payment Date", formatDate(view.payment.paymentDate));
    if (view.payment.method !== "cash" || view.payment.reference) {
      row(doc, "Reference", view.payment.reference || "—");
    }

    if (doc.y > 700) doc.addPage();
    doc.moveDown(1.4);
    doc.font("Noto").fontSize(11).fillColor("#1C1917");
    doc.text("Employee Signature: ____________________", 48, doc.y, { width: 499 });
    doc.moveDown(0.8);
    doc.text("Owner Signature: ____________________", 48, doc.y, { width: 499 });
    doc.moveDown(1.2);
    doc.fontSize(9).fillColor("#57534E");
    doc.text("Generated using HelperBook", { align: "center" });
    doc.text("Simple Staff Management for Small Businesses", { align: "center" });
    doc.text("This receipt is a record of salary payment.", { align: "center" });
    doc.end();
  });
}
