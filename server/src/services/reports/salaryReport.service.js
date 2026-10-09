import SalaryPayment from "../../models/SalaryPayment.js";
import SalaryRecord from "../../models/SalaryRecord.js";
import Employee from "../../models/Employee.js";
import { keyFromDate } from "../../utils/attendanceDate.js";
import { roundMoney } from "../../validators/salary.validator.js";
import { assertExportSize, oneOf, pageOf, prepareReport } from "../../validators/report.validator.js";

const SALARY_STATUSES = ["draft", "finalized", "all"];
const PAYMENT_STATUSES = ["unpaid", "paid", "reversed"];

function money(value) {
  return roundMoney(Number(value) || 0);
}

function paymentState(record, latest) {
  if (record.paymentStatus === "paid") {
    return "paid";
  }
  if (latest?.status === "reversed") {
    return "reversed";
  }
  return "unpaid";
}

/**
 * Salary Report uses stored salary calculation fields.
 * It filters by the salary period, not the payment date.
 * Draft salaries are excluded unless salaryStatus=draft or salaryStatus=all.
 * Paid amount equals final salary only when the salary payment status is paid.
 */
export async function getSalaryReport({ userId, query, forExport = false }) {
  const { shop, range, employee, pagination } = await prepareReport(userId, query, forExport);
  const salaryStatus = oneOf(query.salaryStatus, SALARY_STATUSES, "Salary status");
  const paymentStatus = oneOf(query.paymentStatus, PAYMENT_STATUSES, "Payment status");
  const match = {
    shopId: shop._id,
    periodStart: { $lte: range.toDate },
    periodEnd: { $gte: range.fromDate },
    ...(employee ? { employeeId: employee._id } : {}),
  };
  if (!salaryStatus) {
    match.status = "finalized";
  } else if (salaryStatus !== "all") {
    match.status = salaryStatus;
  }

  const records = await SalaryRecord.find(match).sort({ year: -1, month: -1, createdAt: -1 });
  const payments = await SalaryPayment.find({
    shopId: shop._id,
    salaryId: { $in: records.map((record) => record._id) },
  })
    .sort({ createdAt: -1 })
    .select("salaryId status amount paymentMethod paymentDate paymentReference reversalReason");
  const latestBySalary = new Map();
  payments.forEach((payment) => {
    const key = String(payment.salaryId);
    if (!latestBySalary.has(key)) {
      latestBySalary.set(key, payment);
    }
  });

  const people = await Employee.find({
    shopId: shop._id,
    _id: { $in: records.map((record) => record.employeeId) },
  }).select("name");
  const names = new Map(people.map((person) => [String(person._id), person.name]));

  const rows = records
    .map((record) => {
      const latest = latestBySalary.get(String(record._id));
      const state = paymentState(record, latest);
      const calculation = record.calculation || {};
      const finalSalary = money(calculation.netSalary);
      return {
        salaryId: String(record._id),
        employeeId: String(record.employeeId),
        employeeName: names.get(String(record.employeeId)) || "Employee",
        year: record.year,
        month: record.month,
        periodStart: keyFromDate(record.periodStart),
        periodEnd: keyFromDate(record.periodEnd),
        salaryStatus: record.status,
        baseSalary: money(calculation.baseSalary),
        bonus: money(calculation.bonus),
        grossSalary: money(money(calculation.baseSalary) + money(calculation.bonus)),
        attendanceDeduction: money(calculation.attendanceDeduction),
        leaveDeduction: money(calculation.leaveDeduction),
        otherDeduction: money(calculation.deduction),
        advanceDeduction: money(calculation.advanceDeduction),
        finalSalary,
        paymentStatus: state,
        amountPaid: state === "paid" ? finalSalary : 0,
        paymentDate: latest?.paymentDate ? keyFromDate(latest.paymentDate) : null,
        paymentMethod: state === "paid" ? latest?.paymentMethod || record.paymentMethod || null : latest?.paymentMethod || null,
      };
    })
    .filter((row) => !paymentStatus || row.paymentStatus === paymentStatus);

  assertExportSize(forExport ? rows.length : 0);

  const summary = rows.reduce(
    (totals, row) => {
      totals.employees.add(row.employeeId);
      if (row.salaryStatus === "finalized") totals.finalized += 1;
      if (row.salaryStatus === "draft") totals.drafts += 1;
      const includeMoney = row.salaryStatus === "finalized" || salaryStatus === "draft";
      if (includeMoney) {
        totals.grossSalary = money(totals.grossSalary + row.grossSalary);
        totals.bonus = money(totals.bonus + row.bonus);
        totals.deductions = money(totals.deductions + row.attendanceDeduction + row.leaveDeduction + row.otherDeduction);
        totals.advanceDeduction = money(totals.advanceDeduction + row.advanceDeduction);
        totals.finalSalary = money(totals.finalSalary + row.finalSalary);
        totals.paid = money(totals.paid + row.amountPaid);
        totals.pending = money(totals.pending + (row.paymentStatus === "paid" ? 0 : row.finalSalary));
      }
      return totals;
    },
    {
      employees: new Set(),
      finalized: 0,
      drafts: 0,
      grossSalary: 0,
      bonus: 0,
      deductions: 0,
      advanceDeduction: 0,
      finalSalary: 0,
      paid: 0,
      pending: 0,
    }
  );

  const paged = forExport
    ? { rows, pagination: { page: 1, limit: rows.length, total: rows.length, pages: rows.length ? 1 : 0 } }
    : pageOf(rows, pagination.page, pagination.limit);
  return {
    shop,
    range,
    generatedAt: new Date(),
    fileKind: "Salary",
    filters: {
      from: range.from,
      to: range.to,
      employeeId: employee ? String(employee._id) : null,
      employeeName: employee?.name || "All employees",
      salaryStatus: salaryStatus || "finalized",
      paymentStatus: paymentStatus || "all",
    },
    summary: {
      hasRecords: rows.length > 0,
      employees: summary.employees.size,
      records: rows.length,
      finalized: summary.finalized,
      drafts: summary.drafts,
      grossSalary: summary.grossSalary,
      bonus: summary.bonus,
      deductions: summary.deductions,
      advanceDeduction: summary.advanceDeduction,
      finalSalary: summary.finalSalary,
      paid: summary.paid,
      pending: summary.pending,
    },
    rows: paged.rows,
    pagination: paged.pagination,
  };
}
