import ExcelJS from "exceljs";
import { generatedLabel, periodLabel } from "../../../validators/report.validator.js";

const CURRENCY = '"₹"#,##0.00';
const DATE_FORMAT = "dd-mmm-yyyy";

function styleHeader(sheet, rowNumber, columnCount) {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true };
  row.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: rowNumber }];
  if (columnCount > 0) {
    sheet.autoFilter = {
      from: { row: rowNumber, column: 1 },
      to: { row: rowNumber, column: columnCount },
    };
  }
}

function addMeta(sheet, report, title) {
  sheet.addRow([title]).font = { bold: true, size: 16 };
  sheet.addRow(["Shop", report.shop.name]);
  sheet.addRow(["Period", periodLabel(report.range.from, report.range.to)]);
  sheet.addRow(["Generated", generatedLabel(report.generatedAt)]);
  Object.entries(report.filters)
    .filter(([key]) => !["from", "to", "employeeId"].includes(key))
    .forEach(([key, value]) => sheet.addRow([key, String(value)]));
  sheet.addRow([]);
}

export async function buildReportExcel({ report, title, sheets }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HelperBook";
  sheets.forEach((definition) => {
    const sheet = workbook.addWorksheet(definition.name);
    addMeta(sheet, report, title);
    if (definition.summaryLines?.length) {
      definition.summaryLines.forEach(([label, value]) => sheet.addRow([label, value]));
      sheet.addRow([]);
    }
    const headerRow = sheet.addRow(definition.columns.map((column) => column.label));
    styleHeader(sheet, headerRow.number, definition.columns.length);
    definition.rows.forEach((row) => {
      const values = definition.columns.map((column) => row[column.key] ?? "");
      const added = sheet.addRow(values);
      definition.columns.forEach((column, index) => {
        const cell = added.getCell(index + 1);
        if (column.kind === "money" && typeof cell.value === "number") {
          cell.numFmt = CURRENCY;
        }
        if (column.kind === "date" && cell.value instanceof Date) {
          cell.numFmt = DATE_FORMAT;
        }
      });
    });
    definition.columns.forEach((column, index) => {
      sheet.getColumn(index + 1).width = column.width || 18;
    });
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
