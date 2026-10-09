import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import SalaryPayment from "../models/SalaryPayment.js";
import SalaryRecord from "../models/SalaryRecord.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { keyFromDate } from "../utils/attendanceDate.js";
import { runInTransaction } from "../utils/mongoTransaction.js";
import { roundMoney } from "../validators/salary.validator.js";
import { notifySafely } from "./notification.service.js";
import { onSalaryPaid } from "./notificationEvent.service.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const NOT_FOUND = "Salary could not be found.";
const PAYMENT_NOT_FOUND = "Payment could not be found.";
const ALREADY_PAID = "This salary has already been marked as paid.";
const ONLY_FINALIZED = "Only finalized salary can be paid.";
const ZERO_AMOUNT = "Salary amount must be greater than zero.";
const ALREADY_REVERSED = "This payment has already been reversed.";

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

async function requireShop(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) {
    throw new AppError(SHOP_REQUIRED, 404);
  }
  return shop;
}

export function toPublicPayment(payment) {
  if (!payment) return null;
  return {
    id: String(payment._id),
    salaryId: String(payment.salaryId),
    employeeId: String(payment.employeeId),
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentReference: payment.paymentReference || "",
    paymentDate: keyFromDate(payment.paymentDate),
    status: payment.status,
    notes: payment.notes || "",
    reversalReason: payment.reversalReason || "",
    reversedAt: payment.reversedAt ? new Date(payment.reversedAt).toISOString() : null,
    createdAt: new Date(payment.createdAt).toISOString(),
  };
}

export async function latestPaymentMap(shopId, salaryIds) {
  if (!salaryIds.length) return new Map();
  const payments = await SalaryPayment.find({ shopId, salaryId: { $in: salaryIds } }).sort({ createdAt: -1 });
  const map = new Map();
  for (const payment of payments) {
    const key = String(payment.salaryId);
    if (!map.has(key)) map.set(key, payment);
  }
  return map;
}

function duplicatePayment(error) {
  return error?.code === 11000;
}

async function existingRequest(shopId, requestId) {
  if (!requestId) return null;
  return SalaryPayment.findOne({ shopId, requestId });
}

export async function paySalary(userId, salaryId, input) {
  const shop = await requireShop(userId);
  if (!mongoose.isValidObjectId(salaryId)) {
    throw new AppError(NOT_FOUND, 404);
  }
  const replay = await existingRequest(shop._id, input.requestId);
  if (replay) {
    if (String(replay.salaryId) !== String(salaryId)) {
      throw new AppError("This payment request was already used.", 409);
    }
    const salary = await SalaryRecord.findOne({ _id: replay.salaryId, shopId: shop._id });
    await notifySafely(() => onSalaryPaid({ shop, salary, payment: replay }));
    return { payment: replay, salary, replay: true };
  }

  try {
    const result = await runInTransaction(async (session) => {
      const salaryQuery = SalaryRecord.findOne({ _id: salaryId, shopId: shop._id });
      const salary = await (session ? salaryQuery.session(session) : salaryQuery);
      if (!salary) throw new AppError(NOT_FOUND, 404);
      if (salary.status !== "finalized") throw new AppError(ONLY_FINALIZED, 400);
      if (salary.paymentStatus === "paid") throw new AppError(ALREADY_PAID, 409);
      const amount = roundMoney(salary.calculation?.netSalary || 0);
      if (amount <= 0) throw new AppError(ZERO_AMOUNT, 400);
      const employee = await Employee.findOne({ _id: salary.employeeId, shopId: shop._id });
      if (!employee) throw new AppError("Employee not found.", 404);

      const [payment] = await SalaryPayment.create(
        [
          {
            shopId: shop._id,
            salaryId: salary._id,
            employeeId: salary.employeeId,
            amount,
            paymentMethod: input.paymentMethod,
            paymentReference: input.paymentReference,
            paymentDate: input.paymentDate,
            status: "paid",
            notes: input.notes,
            paidBy: userId,
            requestId: input.requestId || undefined,
          },
        ],
        session ? { session } : {}
      );
      salary.paymentStatus = "paid";
      salary.paymentId = payment._id;
      salary.paidAt = new Date();
      salary.paidBy = userId;
      salary.paymentDate = input.paymentDate;
      salary.paymentMethod = input.paymentMethod;
      salary.paymentReference = input.paymentReference;
      await salary.save(session ? { session } : undefined);
      return { payment, salary, employee };
    });
    await notifySafely(() => onSalaryPaid({ shop, salary: result.salary, payment: result.payment }));
    return result;
  } catch (error) {
    if (duplicatePayment(error)) {
      const again = await existingRequest(shop._id, input.requestId);
      if (again && String(again.salaryId) === String(salaryId)) {
        const salary = await SalaryRecord.findOne({ _id: again.salaryId, shopId: shop._id });
        await notifySafely(() => onSalaryPaid({ shop, salary, payment: again }));
        return { payment: again, salary, replay: true };
      }
      throw new AppError(ALREADY_PAID, 409);
    }
    throw error;
  }
}

export async function reversePayment(userId, paymentId, { reason }) {
  const shop = await requireShop(userId);
  if (!mongoose.isValidObjectId(paymentId)) throw new AppError(PAYMENT_NOT_FOUND, 404);
  return runInTransaction(async (session) => {
    const paymentQuery = SalaryPayment.findOne({ _id: paymentId, shopId: shop._id });
    const payment = await (session ? paymentQuery.session(session) : paymentQuery);
    if (!payment) throw new AppError(PAYMENT_NOT_FOUND, 404);
    if (payment.status !== "paid") throw new AppError(ALREADY_REVERSED, 409);
    const salaryQuery = SalaryRecord.findOne({ _id: payment.salaryId, shopId: shop._id });
    const salary = await (session ? salaryQuery.session(session) : salaryQuery);
    if (!salary) throw new AppError(NOT_FOUND, 404);
    payment.status = "reversed";
    payment.reversedAt = new Date();
    payment.reversedBy = userId;
    payment.reversalReason = reason;
    await payment.save(session ? { session } : undefined);
    if (String(salary.paymentId || "") === String(payment._id)) {
      salary.paymentStatus = "unpaid";
      salary.paymentId = null;
      salary.paidAt = null;
      salary.paidBy = null;
      salary.paymentDate = null;
      salary.paymentMethod = "";
      salary.paymentReference = "";
      await salary.save(session ? { session } : undefined);
    }
    return { payment, salary };
  });
}

function periodLabel(year, month) {
  return `${MONTHS[month - 1]} ${year}`;
}

async function presentPayment(payment, salary, employee) {
  return {
    payment: toPublicPayment(payment),
    employee: employee
      ? { id: String(employee._id), name: employee.name }
      : { id: String(payment.employeeId), name: "" },
    salary: salary
      ? {
          id: String(salary._id),
          year: salary.year,
          month: salary.month,
          periodLabel: periodLabel(salary.year, salary.month),
          netSalary: salary.calculation?.netSalary ?? payment.amount,
          status: salary.status,
          paymentStatus: salary.paymentStatus || "unpaid",
        }
      : null,
  };
}

export async function getPayment(userId, paymentId) {
  const shop = await requireShop(userId);
  if (!mongoose.isValidObjectId(paymentId)) throw new AppError(PAYMENT_NOT_FOUND, 404);
  const payment = await SalaryPayment.findOne({ _id: paymentId, shopId: shop._id });
  if (!payment) throw new AppError(PAYMENT_NOT_FOUND, 404);
  const [salary, employee] = await Promise.all([
    SalaryRecord.findOne({ _id: payment.salaryId, shopId: shop._id }),
    Employee.findOne({ _id: payment.employeeId, shopId: shop._id }).select("name"),
  ]);
  return presentPayment(payment, salary, employee);
}

export async function listPayments(userId, query) {
  const shop = await requireShop(userId);
  const filter = { shopId: shop._id };
  if (query.employeeId) {
    const employee = await Employee.findOne({ _id: query.employeeId, shopId: shop._id }).select("_id");
    if (!employee) throw new AppError("Employee not found.", 404);
    filter.employeeId = employee._id;
  }
  if (query.status) filter.status = query.status;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.year && query.month) {
    const salaries = await SalaryRecord.find({ shopId: shop._id, year: query.year, month: query.month }).select("_id");
    filter.salaryId = { $in: salaries.map((salary) => salary._id) };
  }
  const skip = (query.page - 1) * query.limit;
  const [payments, total] = await Promise.all([
    SalaryPayment.find(filter).sort({ paymentDate: -1, createdAt: -1 }).skip(skip).limit(query.limit),
    SalaryPayment.countDocuments(filter),
  ]);
  const employees = await Employee.find({ shopId: shop._id, _id: { $in: payments.map((payment) => payment.employeeId) } }).select("name");
  const salaries = await SalaryRecord.find({ shopId: shop._id, _id: { $in: payments.map((payment) => payment.salaryId) } }).select(
    "year month calculation.netSalary status paymentStatus"
  );
  const employeeById = new Map(employees.map((employee) => [String(employee._id), employee]));
  const salaryById = new Map(salaries.map((salary) => [String(salary._id), salary]));
  return {
    payments: payments.map((payment) => {
      const presented = {
        ...toPublicPayment(payment),
        employeeName: employeeById.get(String(payment.employeeId))?.name || "",
        periodLabel: salaryById.get(String(payment.salaryId))
          ? periodLabel(salaryById.get(String(payment.salaryId)).year, salaryById.get(String(payment.salaryId)).month)
          : "",
      };
      return presented;
    }),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function getRecentSalaryPayments(shopId, limit = 3) {
  const payments = await SalaryPayment.find({ shopId, status: "paid" })
    .sort({ paymentDate: -1, createdAt: -1 })
    .limit(limit);
  const employees = await Employee.find({ _id: { $in: payments.map((payment) => payment.employeeId) } }).select("name");
  const names = new Map(employees.map((employee) => [String(employee._id), employee.name]));
  return payments.map((payment) => ({
    id: String(payment._id),
    salaryId: String(payment.salaryId),
    employeeName: names.get(String(payment.employeeId)) || "",
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentDate: keyFromDate(payment.paymentDate),
    status: payment.status,
  }));
}

export async function summarizeUnpaidSalaries(shopId) {
  const [finalizedCount, unpaid] = await Promise.all([
    SalaryRecord.countDocuments({ shopId, status: "finalized" }),
    SalaryRecord.find({ shopId, status: "finalized", paymentStatus: { $ne: "paid" } }).select("calculation.netSalary"),
  ]);
  const pendingAmount = roundMoney(unpaid.reduce((sum, row) => sum + Number(row.calculation?.netSalary || 0), 0));
  return {
    pendingAmount,
    pendingEmployees: unpaid.length,
    hasFinalized: finalizedCount > 0,
    allPaid: finalizedCount > 0 && unpaid.length === 0,
  };
}
