import { getAdvanceReport } from "../services/reports/advanceReport.service.js";
import { getAttendanceReport } from "../services/reports/attendanceReport.service.js";
import { getLeaveReport } from "../services/reports/leaveReport.service.js";
import { getPaymentReport } from "../services/reports/paymentReport.service.js";
import { getSalaryReport } from "../services/reports/salaryReport.service.js";
import {
  advanceExcel,
  advancePdf,
  attendanceExcel,
  attendancePdf,
  fileNameFor,
  leaveExcel,
  leavePdf,
  paymentExcel,
  paymentPdf,
  salaryExcel,
  salaryPdf,
} from "../services/reports/export/reportFiles.service.js";

function present(report) {
  const data = {
    summary: report.summary,
    rows: report.rows,
    pagination: report.pagination,
    filters: report.filters,
  };
  if (report.daily) {
    data.daily = report.daily;
    data.dailyPagination = report.dailyPagination;
  }
  if (report.outstanding) {
    data.outstanding = report.outstanding;
  }
  return data;
}

function sendPdf(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(buffer);
}

function sendExcel(res, buffer, filename) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(buffer);
}

async function respond(res, loader) {
  const report = await loader();
  res.json({ success: true, data: present(report) });
}

export function getAttendance(req, res, next) {
  respond(res, () => getAttendanceReport({ userId: req.user.id, query: req.query })).catch(next);
}

export function getSalary(req, res, next) {
  respond(res, () => getSalaryReport({ userId: req.user.id, query: req.query })).catch(next);
}

export function getAdvance(req, res, next) {
  respond(res, () => getAdvanceReport({ userId: req.user.id, query: req.query })).catch(next);
}

export function getLeave(req, res, next) {
  respond(res, () => getLeaveReport({ userId: req.user.id, query: req.query })).catch(next);
}

export function getPayments(req, res, next) {
  respond(res, () => getPaymentReport({ userId: req.user.id, query: req.query })).catch(next);
}

export function exportAttendancePdf(req, res, next) {
  getAttendanceReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendPdf(res, await attendancePdf(report), fileNameFor(report, "pdf")))
    .catch(next);
}

export function exportAttendanceExcel(req, res, next) {
  getAttendanceReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendExcel(res, await attendanceExcel(report), fileNameFor(report, "xlsx")))
    .catch(next);
}

export function exportSalaryPdf(req, res, next) {
  getSalaryReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendPdf(res, await salaryPdf(report), fileNameFor(report, "pdf")))
    .catch(next);
}

export function exportSalaryExcel(req, res, next) {
  getSalaryReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendExcel(res, await salaryExcel(report), fileNameFor(report, "xlsx")))
    .catch(next);
}

export function exportAdvancePdf(req, res, next) {
  getAdvanceReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendPdf(res, await advancePdf(report), fileNameFor(report, "pdf")))
    .catch(next);
}

export function exportAdvanceExcel(req, res, next) {
  getAdvanceReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendExcel(res, await advanceExcel(report), fileNameFor(report, "xlsx")))
    .catch(next);
}

export function exportLeavePdf(req, res, next) {
  getLeaveReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendPdf(res, await leavePdf(report), fileNameFor(report, "pdf")))
    .catch(next);
}

export function exportLeaveExcel(req, res, next) {
  getLeaveReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendExcel(res, await leaveExcel(report), fileNameFor(report, "xlsx")))
    .catch(next);
}

export function exportPaymentPdf(req, res, next) {
  getPaymentReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendPdf(res, await paymentPdf(report), fileNameFor(report, "pdf")))
    .catch(next);
}

export function exportPaymentExcel(req, res, next) {
  getPaymentReport({ userId: req.user.id, query: req.query, forExport: true })
    .then(async (report) => sendExcel(res, await paymentExcel(report), fileNameFor(report, "xlsx")))
    .catch(next);
}
