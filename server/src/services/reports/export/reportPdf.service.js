import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { formatInr } from "../../../utils/currency.js";
import { generatedLabel, periodLabel } from "../../../validators/report.validator.js";

const fontDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../../assets/fonts");
const regularFont = readFileSync(path.join(fontDir, "NotoSans-Regular.ttf"));
const boldFont = readFileSync(path.join(fontDir, "NotoSans-Bold.ttf"));

function finish(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function addFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    doc.font("Noto").fontSize(8).fillColor("#5C6B66");
    doc.text("Generated using HelperBook", 40, 800, { lineBreak: false });
    doc.text("Simple Staff Management for Small Businesses", 40, 812, { lineBreak: false });
    doc.text(`Page ${index + 1} of ${range.count}`, 400, 800, { width: 155, align: "right", lineBreak: false });
  }
}

function sectionTitle(doc, text) {
  if (doc.y > 720) {
    doc.addPage();
  }
  doc.moveDown(0.6);
  doc.font("NotoBold").fontSize(12).fillColor("#146C54").text(text);
  doc.moveDown(0.3);
}

export async function buildReportPdf({ report, title, summaryLines, columns, rows }) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  doc.registerFont("Noto", regularFont);
  doc.registerFont("NotoBold", boldFont);
  doc.font("NotoBold").fontSize(11).fillColor("#146C54").text("HELPERBOOK");
  doc.font("NotoBold").fontSize(18).fillColor("#17332C").text(title);
  doc.moveDown(0.3);
  doc.font("Noto").fontSize(11).fillColor("#17332C").text(report.shop.name);
  if (report.shop.businessType) {
    doc.fontSize(10).fillColor("#5C6B66").text(String(report.shop.businessType).replaceAll("_", " "));
  }
  doc.fillColor("#17332C").text(`Period: ${periodLabel(report.range.from, report.range.to)}`);
  doc.text(`Generated: ${generatedLabel(report.generatedAt)}`);
  const filterLine = Object.entries(report.filters)
    .filter(([key]) => !["from", "to", "employeeId"].includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join("  ·  ");
  if (filterLine) {
    doc.fillColor("#5C6B66").text(filterLine);
  }

  sectionTitle(doc, "Summary");
  summaryLines.forEach(([label, value]) => {
    doc.font("Noto").fontSize(10).fillColor("#17332C").text(`${label}`, { continued: true });
    doc.font("NotoBold").text(`    ${value}`, { align: "right" });
  });

  sectionTitle(doc, "Details");
  const tableTop = () => {
    const y = doc.y;
    doc.font("NotoBold").fontSize(8).fillColor("#17332C");
    let x = 40;
    columns.forEach((column) => {
      doc.text(column.label, x, y, { width: column.width, lineBreak: false });
      x += column.width;
    });
    doc.moveDown(0.8);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#D5E3DD").stroke();
    doc.moveDown(0.3);
  };
  tableTop();
  rows.forEach((row) => {
    if (doc.y > 760) {
      doc.addPage();
      tableTop();
    }
    const y = doc.y;
    let x = 40;
    const height = Math.max(
      ...columns.map((column) => doc.heightOfString(String(row[column.key] ?? ""), { width: column.width }))
    );
    doc.font("Noto").fontSize(8).fillColor("#17332C");
    columns.forEach((column) => {
      doc.text(String(row[column.key] ?? ""), x, y, { width: column.width });
      x += column.width;
    });
    doc.y = y + height + 6;
  });
  if (!rows.length) {
    doc.font("Noto").fontSize(10).fillColor("#5C6B66").text("No records found for this period.");
  }

  addFooters(doc);
  return finish(doc);
}

export function inr(value) {
  return formatInr(value);
}
