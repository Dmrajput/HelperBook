import { formatInr } from "../../../utils/currency.js";
import { excelDate, formatReportDate, reportFileName } from "../../../validators/report.validator.js";
import { buildReportExcel } from "./reportExcel.service.js";
import { buildReportPdf } from "./reportPdf.service.js";

const METHOD_LABELS = { cash: "Cash", upi: "UPI", bank: "Bank Transfer", all: "All" };

function moneyRows(lines) {
  return lines.map(([label, value]) => [label, typeof value === "number" ? formatInr(value) : String(value)]);
}

export function fileNameFor(report, extension) {
  return reportFileName(report.fileKind, report.range.from, report.range.to, extension);
}

export function attendancePdf(report) {
  return buildReportPdf({
    report,
    title: "Attendance Report",
    summaryLines: moneyRows([
      ["Employees", report.summary.employees],
      ["Present", report.summary.present],
      ["Absent", report.summary.absent],
      ["Half Days", report.summary.halfDay],
      ["Leave", report.summary.leave],
    ]),
    columns: [
      { key: "employeeName", label: "Employee", width: 180 },
      { key: "present", label: "Present", width: 80 },
      { key: "absent", label: "Absent", width: 80 },
      { key: "halfDay", label: "Half Day", width: 80 },
      { key: "leave", label: "Leave", width: 70 },
    ],
    rows: report.rows,
  });
}

export function attendanceExcel(report) {
  return buildReportExcel({
    report,
    title: "HelperBook Attendance Report",
    sheets: [
      {
        name: "Attendance Summary",
        summaryLines: [
          ["Employees", report.summary.employees],
          ["Present", report.summary.present],
          ["Absent", report.summary.absent],
          ["Half Days", report.summary.halfDay],
          ["Leave", report.summary.leave],
        ],
        columns: [
          { key: "employeeName", label: "Employee", width: 24 },
          { key: "present", label: "Present", width: 12 },
          { key: "absent", label: "Absent", width: 12 },
          { key: "halfDay", label: "Half Day", width: 12 },
          { key: "leave", label: "Leave", width: 12 },
        ],
        rows: report.rows,
      },
      {
        name: "Attendance Details",
        columns: [
          { key: "dateValue", label: "Date", kind: "date", width: 16 },
          { key: "employeeName", label: "Employee", width: 24 },
          { key: "statusLabel", label: "Status", width: 14 },
        ],
        rows: report.daily.map((row) => ({ ...row, dateValue: excelDate(row.date) })),
      },
    ],
  });
}

export function salaryPdf(report) {
  return buildReportPdf({
    report,
    title: "Salary Report",
    summaryLines: moneyRows([
      ["Employees", report.summary.employees],
      ["Finalized Salaries", report.summary.finalized],
      ["Gross Salary", report.summary.grossSalary],
      ["Bonus", report.summary.bonus],
      ["Deductions", report.summary.deductions],
      ["Advance Deduction", report.summary.advanceDeduction],
      ["Final Salary", report.summary.finalSalary],
      ["Paid", report.summary.paid],
      ["Pending", report.summary.pending],
    ]),
    columns: [
      { key: "employeeName", label: "Employee", width: 110 },
      { key: "gross", label: "Gross", width: 70 },
      { key: "bonus", label: "Bonus", width: 60 },
      { key: "deductions", label: "Deductions", width: 70 },
      { key: "advance", label: "Advance", width: 65 },
      { key: "final", label: "Final", width: 70 },
      { key: "payment", label: "Payment", width: 60 },
    ],
    rows: report.rows.map((row) => ({
      employeeName: row.employeeName,
      gross: formatInr(row.grossSalary),
      bonus: formatInr(row.bonus),
      deductions: formatInr(row.attendanceDeduction + row.leaveDeduction + row.otherDeduction),
      advance: formatInr(row.advanceDeduction),
      final: formatInr(row.finalSalary),
      payment: row.paymentStatus,
    })),
  });
}

export function salaryExcel(report) {
  return buildReportExcel({
    report,
    title: "HelperBook Salary Report",
    sheets: [
      {
        name: "Salary Summary",
        summaryLines: [
          ["Employees", report.summary.employees],
          ["Finalized Salaries", report.summary.finalized],
          ["Gross Salary", report.summary.grossSalary],
          ["Bonus", report.summary.bonus],
          ["Deductions", report.summary.deductions],
          ["Advance Deduction", report.summary.advanceDeduction],
          ["Final Salary", report.summary.finalSalary],
          ["Paid", report.summary.paid],
          ["Pending", report.summary.pending],
        ],
        columns: [
          { key: "label", label: "Metric", width: 24 },
          { key: "value", label: "Value", width: 18 },
        ],
        rows: [],
      },
      {
        name: "Salary Details",
        columns: [
          { key: "employeeName", label: "Employee", width: 24 },
          { key: "periodStartValue", label: "Period Start", kind: "date", width: 16 },
          { key: "periodEndValue", label: "Period End", kind: "date", width: 16 },
          { key: "baseSalary", label: "Basic Salary", kind: "money", width: 16 },
          { key: "bonus", label: "Bonus", kind: "money", width: 14 },
          { key: "deductions", label: "Deductions", kind: "money", width: 14 },
          { key: "advanceDeduction", label: "Advance Deduction", kind: "money", width: 18 },
          { key: "finalSalary", label: "Final Salary", kind: "money", width: 16 },
          { key: "paymentStatus", label: "Payment Status", width: 16 },
          { key: "paymentDateValue", label: "Payment Date", kind: "date", width: 16 },
          { key: "paymentMethodLabel", label: "Payment Method", width: 18 },
        ],
        rows: report.rows.map((row) => ({
          ...row,
          deductions: row.attendanceDeduction + row.leaveDeduction + row.otherDeduction,
          periodStartValue: excelDate(row.periodStart),
          periodEndValue: excelDate(row.periodEnd),
          paymentDateValue: excelDate(row.paymentDate),
          paymentMethodLabel: METHOD_LABELS[row.paymentMethod] || "",
        })),
      },
    ],
  });
}

export function advancePdf(report) {
  return buildReportPdf({
    report,
    title: "Advance Report",
    summaryLines: moneyRows([
      ["Advances Given", report.summary.advancesGiven],
      ["Repayments", report.summary.repayments],
      ["Salary Deductions", report.summary.salaryDeductions],
      ["Adjustments", report.summary.adjustments],
      ["Reversals", report.summary.reversals],
      ["Current Outstanding", report.summary.currentOutstanding],
    ]),
    columns: [
      { key: "dateLabel", label: "Date", width: 80 },
      { key: "employeeName", label: "Employee", width: 120 },
      { key: "typeLabel", label: "Type", width: 110 },
      { key: "amountLabel", label: "Amount", width: 80 },
      { key: "balanceLabel", label: "Balance", width: 80 },
    ],
    rows: report.rows.map((row) => ({
      ...row,
      dateLabel: formatReportDate(row.date),
      amountLabel: formatInr(row.amount),
      balanceLabel: formatInr(row.runningBalance),
    })),
  });
}

export function advanceExcel(report) {
  const sheets = [
    {
      name: "Advance Summary",
      summaryLines: [
        ["Advances Given", report.summary.advancesGiven],
        ["Repayments", report.summary.repayments],
        ["Salary Deductions", report.summary.salaryDeductions],
        ["Adjustments", report.summary.adjustments],
        ["Reversals", report.summary.reversals],
        ["Current Outstanding", report.summary.currentOutstanding],
      ],
      columns: [
        { key: "label", label: "Metric", width: 24 },
        { key: "value", label: "Value", width: 18 },
      ],
      rows: [],
    },
    {
      name: "Advance Transactions",
      columns: [
        { key: "dateValue", label: "Date", kind: "date", width: 16 },
        { key: "employeeName", label: "Employee", width: 24 },
        { key: "typeLabel", label: "Type", width: 20 },
        { key: "amount", label: "Amount", kind: "money", width: 14 },
        { key: "runningBalance", label: "Running Balance", kind: "money", width: 18 },
        { key: "reversedLabel", label: "Reversed", width: 12 },
      ],
      rows: report.rows.map((row) => ({
        ...row,
        dateValue: excelDate(row.date),
        reversedLabel: row.reversed ? "Yes" : "",
      })),
    },
  ];
  if (report.outstanding?.length) {
    sheets.push({
      name: "Outstanding",
      columns: [
        { key: "employeeName", label: "Employee", width: 24 },
        { key: "currentOutstanding", label: "Current Outstanding", kind: "money", width: 22 },
      ],
      rows: report.outstanding,
    });
  }
  return buildReportExcel({ report, title: "HelperBook Advance Report", sheets });
}

export function leavePdf(report) {
  return buildReportPdf({
    report,
    title: "Leave Report",
    summaryLines: [
      ["Approved Days", String(report.summary.approvedDays)],
      ["Paid Leave", String(report.summary.paidLeave)],
      ["Unpaid Leave", String(report.summary.unpaidLeave)],
      ["Sick Leave", String(report.summary.sickLeave)],
      ["Pending Requests", String(report.summary.pendingRequests)],
    ],
    columns: [
      { key: "employeeName", label: "Employee", width: 100 },
      { key: "leaveTypeLabel", label: "Type", width: 80 },
      { key: "salaryTreatment", label: "Treatment", width: 70 },
      { key: "startLabel", label: "Start", width: 70 },
      { key: "endLabel", label: "End", width: 70 },
      { key: "daysInRange", label: "Days", width: 40 },
      { key: "statusLabel", label: "Status", width: 60 },
    ],
    rows: report.rows.map((row) => ({
      ...row,
      startLabel: formatReportDate(row.startDate),
      endLabel: formatReportDate(row.endDate),
    })),
  });
}

export function leaveExcel(report) {
  return buildReportExcel({
    report,
    title: "HelperBook Leave Report",
    sheets: [
      {
        name: "Leave Summary",
        summaryLines: [
          ["Approved Days", report.summary.approvedDays],
          ["Paid Leave", report.summary.paidLeave],
          ["Unpaid Leave", report.summary.unpaidLeave],
          ["Sick Leave", report.summary.sickLeave],
          ["Pending Requests", report.summary.pendingRequests],
        ],
        columns: [
          { key: "label", label: "Metric", width: 24 },
          { key: "value", label: "Value", width: 16 },
        ],
        rows: [],
      },
      {
        name: "Leave Details",
        columns: [
          { key: "employeeName", label: "Employee", width: 24 },
          { key: "leaveTypeLabel", label: "Leave Type", width: 16 },
          { key: "salaryTreatment", label: "Salary Treatment", width: 18 },
          { key: "startValue", label: "Start Date", kind: "date", width: 16 },
          { key: "endValue", label: "End Date", kind: "date", width: 16 },
          { key: "daysInRange", label: "Days", width: 10 },
          { key: "statusLabel", label: "Status", width: 14 },
        ],
        rows: report.rows.map((row) => ({
          ...row,
          startValue: excelDate(row.startDate),
          endValue: excelDate(row.endDate),
        })),
      },
    ],
  });
}

export function paymentPdf(report) {
  return buildReportPdf({
    report,
    title: "Payment Report",
    summaryLines: moneyRows([
      ["Paid Payments", report.summary.paidPayments],
      ["Total Paid", report.summary.totalPaid],
      ["Cash", report.summary.cash],
      ["UPI", report.summary.upi],
      ["Bank Transfer", report.summary.bank],
      ["Reversed Payments", report.summary.reversedPayments],
    ]),
    columns: [
      { key: "dateLabel", label: "Date", width: 75 },
      { key: "employeeName", label: "Employee", width: 100 },
      { key: "salaryPeriod", label: "Period", width: 80 },
      { key: "amountLabel", label: "Amount", width: 70 },
      { key: "paymentMethodLabel", label: "Method", width: 70 },
      { key: "reference", label: "Reference", width: 70 },
      { key: "statusLabel", label: "Status", width: 55 },
    ],
    rows: report.rows.map((row) => ({
      ...row,
      dateLabel: formatReportDate(row.paymentDate),
      amountLabel: formatInr(row.amount),
    })),
  });
}

export function paymentExcel(report) {
  return buildReportExcel({
    report,
    title: "HelperBook Payment Report",
    sheets: [
      {
        name: "Payment Summary",
        summaryLines: [
          ["Paid Payments", report.summary.paidPayments],
          ["Total Paid", report.summary.totalPaid],
          ["Cash", report.summary.cash],
          ["UPI", report.summary.upi],
          ["Bank Transfer", report.summary.bank],
          ["Reversed Payments", report.summary.reversedPayments],
        ],
        columns: [
          { key: "label", label: "Metric", width: 24 },
          { key: "value", label: "Value", width: 18 },
        ],
        rows: [],
      },
      {
        name: "Payment Details",
        columns: [
          { key: "dateValue", label: "Payment Date", kind: "date", width: 16 },
          { key: "employeeName", label: "Employee", width: 24 },
          { key: "salaryPeriod", label: "Salary Period", width: 18 },
          { key: "amount", label: "Amount", kind: "money", width: 14 },
          { key: "paymentMethodLabel", label: "Payment Method", width: 18 },
          { key: "reference", label: "Reference", width: 20 },
          { key: "statusLabel", label: "Status", width: 12 },
        ],
        rows: report.rows.map((row) => ({ ...row, dateValue: excelDate(row.paymentDate) })),
      },
    ],
  });
}
