import AdvanceTransaction from "../../models/AdvanceTransaction.js";
import EmployeeAdvance from "../../models/EmployeeAdvance.js";
import Employee from "../../models/Employee.js";
import { ADVANCE_STATUSES, ADVANCE_TRANSACTION_TYPES } from "../../constants/advance.js";
import { keyFromDate } from "../../utils/attendanceDate.js";
import { roundMoney } from "../../validators/salary.validator.js";
import { assertExportSize, oneOf, pageOf, prepareReport } from "../../validators/report.validator.js";

const TYPE_LABELS = {
  advance: "Advance",
  repayment: "Repayment",
  salary_deduction: "Salary Deduction",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

function money(value) {
  return roundMoney(Number(value) || 0);
}

/**
 * Advance Report reads the transaction ledger.
 * Period totals use AdvanceTransaction.date.
 * Outstanding is the current ledger balance (sum of signedAmount), not a period-end balance.
 * Reversals stay visible. Salary deductions are not counted as new advances.
 */
export async function getAdvanceReport({ userId, query, forExport = false }) {
  const { shop, range, employee, pagination } = await prepareReport(userId, query, forExport);
  const advanceStatus = oneOf(query.advanceStatus, ADVANCE_STATUSES, "Advance status");
  const transactionType = oneOf(query.transactionType, ADVANCE_TRANSACTION_TYPES, "Transaction type");

  const advances = await EmployeeAdvance.find({
    shopId: shop._id,
    ...(employee ? { employeeId: employee._id } : {}),
    ...(advanceStatus ? { status: advanceStatus } : {}),
  }).select("_id employeeId");
  const advanceIds = advances.map((advance) => advance._id);

  const periodMatch = {
    shopId: shop._id,
    advanceId: { $in: advanceIds },
    date: { $gte: range.fromDate, $lte: range.toDate },
    ...(transactionType ? { type: transactionType } : {}),
  };
  const transactions = advanceIds.length
    ? await AdvanceTransaction.find(periodMatch).sort({ date: -1, createdAt: -1, _id: -1 })
    : [];
  assertExportSize(forExport ? transactions.length : 0);

  const history = advanceIds.length
    ? await AdvanceTransaction.find({
        shopId: shop._id,
        advanceId: { $in: advanceIds },
      }).sort({ date: 1, createdAt: 1, _id: 1 })
    : [];
  const running = new Map();
  const balanceAfter = new Map();
  const outstandingByEmployee = new Map();
  history.forEach((transaction) => {
    const employeeKey = String(transaction.employeeId);
    const next = money((running.get(employeeKey) || 0) + Number(transaction.signedAmount || 0));
    running.set(employeeKey, next);
    outstandingByEmployee.set(employeeKey, next);
    balanceAfter.set(String(transaction._id), next);
  });

  const people = await Employee.find({
    shopId: shop._id,
    _id: { $in: [...outstandingByEmployee.keys(), ...transactions.map((row) => row.employeeId)] },
  }).select("name");
  const names = new Map(people.map((person) => [String(person._id), person.name]));

  const summary = transactions.reduce(
    (totals, transaction) => {
      const amount = money(transaction.amount);
      if (transaction.type === "advance") totals.advancesGiven = money(totals.advancesGiven + amount);
      else if (transaction.type === "repayment") totals.repayments = money(totals.repayments + amount);
      else if (transaction.type === "salary_deduction") totals.salaryDeductions = money(totals.salaryDeductions + amount);
      else if (transaction.type === "adjustment") totals.adjustments = money(totals.adjustments + amount);
      else if (transaction.type === "reversal") totals.reversals = money(totals.reversals + amount);
      return totals;
    },
    { advancesGiven: 0, repayments: 0, salaryDeductions: 0, adjustments: 0, reversals: 0 }
  );
  const currentOutstanding = money([...outstandingByEmployee.values()].reduce((sum, value) => sum + value, 0));

  const rows = transactions.map((transaction) => ({
    transactionId: String(transaction._id),
    employeeId: String(transaction.employeeId),
    employeeName: names.get(String(transaction.employeeId)) || "Employee",
    date: keyFromDate(transaction.date),
    type: transaction.type,
    typeLabel: TYPE_LABELS[transaction.type] || transaction.type,
    amount: money(transaction.amount),
    reversed: Boolean(transaction.reversed),
    runningBalance: balanceAfter.get(String(transaction._id)) ?? 0,
    notes: transaction.notes || "",
  }));
  const outstanding = [...outstandingByEmployee.entries()]
    .map(([employeeId, balance]) => ({
      employeeId,
      employeeName: names.get(employeeId) || "Employee",
      currentOutstanding: balance,
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const paged = forExport
    ? { rows, pagination: { page: 1, limit: rows.length, total: rows.length, pages: rows.length ? 1 : 0 } }
    : pageOf(rows, pagination.page, pagination.limit);
  return {
    shop,
    range,
    generatedAt: new Date(),
    fileKind: "Advance",
    filters: {
      from: range.from,
      to: range.to,
      employeeId: employee ? String(employee._id) : null,
      employeeName: employee?.name || "All employees",
      advanceStatus: advanceStatus || "all",
      transactionType: transactionType || "all",
    },
    summary: {
      hasRecords: rows.length > 0,
      transactions: rows.length,
      ...summary,
      currentOutstanding,
      outstandingLabel: "Current outstanding",
    },
    rows: paged.rows,
    outstanding,
    pagination: paged.pagination,
  };
}
