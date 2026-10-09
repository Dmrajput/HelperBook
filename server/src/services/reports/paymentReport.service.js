import SalaryPayment from "../../models/SalaryPayment.js";
import SalaryRecord from "../../models/SalaryRecord.js";
import Employee from "../../models/Employee.js";
import { SALARY_PAYMENT_METHODS } from "../../constants/salary.js";
import { keyFromDate } from "../../utils/attendanceDate.js";
import { roundMoney } from "../../validators/salary.validator.js";
import { assertExportSize, oneOf, pageOf, prepareReport } from "../../validators/report.validator.js";

const PAYMENT_STATUSES = ["paid", "reversed"];
const METHOD_LABELS = { cash: "Cash", upi: "UPI", bank: "Bank Transfer" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function money(value) {
  return roundMoney(Number(value) || 0);
}

/**
 * Payment Report uses SalaryPayment records and filters by paymentDate.
 * Total Paid includes only payments whose status is paid.
 * Reversed payments stay in history and do not add to Total Paid.
 */
export async function getPaymentReport({ userId, query, forExport = false }) {
  const { shop, range, employee, pagination } = await prepareReport(userId, query, forExport);
  const paymentMethod = oneOf(query.paymentMethod, SALARY_PAYMENT_METHODS, "Payment method");
  const status = oneOf(query.status, PAYMENT_STATUSES, "Status");
  const match = {
    shopId: shop._id,
    paymentDate: { $gte: range.fromDate, $lte: range.toDate },
    ...(employee ? { employeeId: employee._id } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(status ? { status } : {}),
  };

  const payments = await SalaryPayment.find(match).sort({ paymentDate: -1, createdAt: -1 });
  assertExportSize(forExport ? payments.length : 0);
  const salaries = await SalaryRecord.find({
    shopId: shop._id,
    _id: { $in: payments.map((payment) => payment.salaryId) },
  }).select("year month");
  const salaryById = new Map(salaries.map((salary) => [String(salary._id), salary]));
  const people = await Employee.find({
    shopId: shop._id,
    _id: { $in: payments.map((payment) => payment.employeeId) },
  }).select("name");
  const names = new Map(people.map((person) => [String(person._id), person.name]));

  const rows = payments.map((payment) => {
    const salary = salaryById.get(String(payment.salaryId));
    return {
      paymentId: String(payment._id),
      salaryId: String(payment.salaryId),
      employeeId: String(payment.employeeId),
      employeeName: names.get(String(payment.employeeId)) || "Employee",
      salaryPeriod: salary ? `${MONTHS[salary.month - 1]} ${salary.year}` : "",
      paymentDate: keyFromDate(payment.paymentDate),
      amount: money(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentMethodLabel: METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod,
      reference: payment.paymentReference || "",
      status: payment.status,
      statusLabel: payment.status === "reversed" ? "Reversed" : "Paid",
      reversalReason: payment.reversalReason || "",
    };
  });

  const summary = rows.reduce(
    (totals, row) => {
      if (row.status === "paid") {
        totals.paidPayments += 1;
        totals.totalPaid = money(totals.totalPaid + row.amount);
        if (row.paymentMethod === "cash") totals.cash = money(totals.cash + row.amount);
        if (row.paymentMethod === "upi") totals.upi = money(totals.upi + row.amount);
        if (row.paymentMethod === "bank") totals.bank = money(totals.bank + row.amount);
      }
      if (row.status === "reversed") totals.reversedPayments += 1;
      return totals;
    },
    { paidPayments: 0, reversedPayments: 0, totalPaid: 0, cash: 0, upi: 0, bank: 0 }
  );

  const paged = forExport
    ? { rows, pagination: { page: 1, limit: rows.length, total: rows.length, pages: rows.length ? 1 : 0 } }
    : pageOf(rows, pagination.page, pagination.limit);
  return {
    shop,
    range,
    generatedAt: new Date(),
    fileKind: "Payment",
    filters: {
      from: range.from,
      to: range.to,
      employeeId: employee ? String(employee._id) : null,
      employeeName: employee?.name || "All employees",
      paymentMethod: paymentMethod || "all",
      status: status || "all",
    },
    summary: { hasRecords: rows.length > 0, records: rows.length, ...summary },
    rows: paged.rows,
    pagination: paged.pagination,
  };
}
