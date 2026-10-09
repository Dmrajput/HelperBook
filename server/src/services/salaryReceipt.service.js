import { readFile } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import ReceiptCounter from "../models/ReceiptCounter.js";
import SalaryPayment from "../models/SalaryPayment.js";
import SalaryReceipt from "../models/SalaryReceipt.js";
import SalaryRecord from "../models/SalaryRecord.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { keyFromDate } from "../utils/attendanceDate.js";
import { getLocalUploadRoot } from "./storage/providers/local.provider.js";
import { buildSalaryReceiptPdf } from "./salaryReceiptPdf.service.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const NOT_FOUND = "Salary could not be found.";
const UNPAID = "Salary receipt is available only after salary payment.";
const REVERSED = "Salary payment has been reversed. A receipt cannot be issued for this payment.";

const ROLE_LABELS = {
  helper: "Helper",
  sales_staff: "Sales Staff",
  cashier: "Cashier",
  manager: "Manager",
  delivery: "Delivery",
  cook: "Cook",
  cleaner: "Cleaner",
  driver: "Driver",
  accountant: "Accountant",
  other: "Other",
};

const METHOD_LABELS = {
  cash: "Cash",
  upi: "UPI",
  bank: "Bank Transfer",
};

async function requireShop(userId) {
  const user = await User.findById(userId).select("fullName countryCode phoneNumber isActive");
  if (!user || !user.isActive) {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }
  const shop = await Shop.findOne({ ownerId: user._id, isActive: true });
  if (!shop) {
    throw new AppError(SHOP_REQUIRED, 404);
  }
  return { user, shop };
}

function clean(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function formatPhone(value) {
  const digits = clean(value).replace(/\D/g, "");
  const national = digits.length >= 10 ? digits.slice(-10) : "";
  if (!/^[6-9]\d{9}$/.test(national)) return "";
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}

function roleLabel(employee) {
  if (employee.role === "other" && clean(employee.customRole)) return clean(employee.customRole);
  return ROLE_LABELS[employee.role] || "";
}

function businessLabel(shop) {
  if (shop.businessType === "Other" && clean(shop.customBusinessType)) return clean(shop.customBusinessType);
  return clean(shop.businessType);
}

function addressLines(address) {
  if (!address) return [];
  return [address.addressLine1, address.addressLine2, [address.city, address.state].filter(Boolean).join(", "), address.pincode, address.country]
    .map(clean)
    .filter(Boolean);
}

function moneyLine(label, amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { label, amount: value };
}

function buildLines(salary) {
  const calculation = salary.calculation || {};
  const lines = [];
  const base = moneyLine("Base Salary", calculation.baseSalary);
  if (base) lines.push({ ...base, section: "earning" });
  else lines.push({ label: "Base Salary", amount: 0, section: "earning" });
  const attendance = moneyLine("Attendance Deduction", calculation.attendanceDeduction);
  if (attendance) lines.push({ ...attendance, section: "deduction" });
  const bonuses = Array.isArray(salary.bonuses) ? salary.bonuses : [];
  if (bonuses.length > 0) {
    for (const bonus of bonuses) {
      const line = moneyLine(clean(bonus.reason) || "Bonus", bonus.amount);
      if (line) lines.push({ ...line, section: "earning" });
    }
  } else {
    const bonus = moneyLine("Bonus", calculation.bonus);
    if (bonus) lines.push({ ...bonus, section: "earning" });
  }
  const leave = moneyLine("Unpaid Leave", calculation.leaveDeduction);
  if (leave) lines.push({ ...leave, section: "deduction" });
  const deductions = Array.isArray(salary.deductions) ? salary.deductions : [];
  if (deductions.length > 0) {
    for (const deduction of deductions) {
      const line = moneyLine(clean(deduction.reason) || "Other Deduction", deduction.amount);
      if (line) lines.push({ ...line, section: "deduction" });
    }
  } else {
    const other = moneyLine("Other Deduction", calculation.deduction);
    if (other) lines.push({ ...other, section: "deduction" });
  }
  const advance = moneyLine("Advance Deduction", calculation.advanceDeduction);
  if (advance) lines.push({ ...advance, section: "deduction" });
  return lines;
}

function toView({ shop, user, employee, salary, payment, receipt }) {
  const periodStart = keyFromDate(salary.periodStart);
  const periodEnd = keyFromDate(salary.periodEnd);
  const paymentDate = keyFromDate(payment.paymentDate);
  const phone = formatPhone(shop.contact?.shopPhone) || formatPhone(`${user.countryCode || ""}${user.phoneNumber || ""}`);
  const email = clean(shop.contact?.email) || clean(shop.owner?.email);
  return {
    receipt: {
      receiptNumber: receipt.receiptNumber,
      receiptDate: paymentDate,
      generatedAt: new Date(receipt.generatedAt).toISOString(),
    },
    shop: {
      name: clean(shop.name),
      businessType: businessLabel(shop),
      logoUrl: clean(shop.logo?.url),
      ownerName: clean(shop.owner?.fullName),
      phone,
      email,
      addressLines: addressLines(shop.address),
    },
    employee: {
      name: clean(employee.name),
      role: roleLabel(employee),
      phone: formatPhone(employee.phone),
      joiningDate: employee.joiningDate ? keyFromDate(employee.joiningDate) : "",
    },
    period: {
      startDate: periodStart,
      endDate: periodEnd,
      month: salary.month,
      year: salary.year,
    },
    attendance: {
      workingDays: salary.workingDays,
      presentDays: salary.attendance?.presentDays ?? 0,
      absentDays: salary.attendance?.absentDays ?? 0,
      halfDays: salary.attendance?.halfDays ?? 0,
      leaveDays: salary.attendance?.leaveDays ?? 0,
      paidLeaveDays: salary.attendance?.paidLeaveDays ?? 0,
      unpaidLeaveDays: salary.attendance?.unpaidLeaveDays ?? 0,
    },
    lines: buildLines(salary),
    finalSalary: Number(salary.calculation?.netSalary || 0),
    payment: {
      status: "paid",
      amount: payment.amount,
      method: payment.paymentMethod,
      methodLabel: METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod,
      reference: clean(payment.paymentReference),
      paymentDate,
    },
  };
}

async function nextReceiptNumber(year) {
  const key = `salary-receipt-${year}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const row = await ReceiptCounter.findOneAndUpdate(
        { key },
        { $inc: { sequence: 1 } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      const sequence = Number(row?.sequence || 0);
      return `HB-SAL-${year}-${String(sequence).padStart(6, "0")}`;
    } catch (error) {
      if (error?.code !== 11000 || attempt === 2) throw error;
    }
  }
  throw new AppError("Unable to generate salary receipt.", 500);
}

async function ensureReceipt(shop, salary, payment) {
  const existing = await SalaryReceipt.findOne({ shopId: shop._id, paymentId: payment._id });
  if (existing) return existing;
  const year = Number(keyFromDate(payment.paymentDate).slice(0, 4));
  const receiptNumber = await nextReceiptNumber(year);
  try {
    return await SalaryReceipt.create({
      shopId: shop._id,
      salaryId: salary._id,
      employeeId: salary.employeeId,
      paymentId: payment._id,
      receiptNumber,
      generatedAt: new Date(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      const again = await SalaryReceipt.findOne({ shopId: shop._id, paymentId: payment._id });
      if (again) return again;
    }
    throw error;
  }
}

async function loadEligible(userId, salaryId) {
  const { user, shop } = await requireShop(userId);
  if (!mongoose.isValidObjectId(salaryId)) throw new AppError(NOT_FOUND, 404);
  const salary = await SalaryRecord.findOne({ _id: salaryId, shopId: shop._id });
  if (!salary) throw new AppError(NOT_FOUND, 404);
  if (salary.status !== "finalized" || salary.paymentStatus !== "paid") {
    const latest = await SalaryPayment.findOne({ shopId: shop._id, salaryId: salary._id }).sort({ createdAt: -1 });
    if (salary.status === "finalized" && latest?.status === "reversed") {
      throw new AppError(REVERSED, 400);
    }
    throw new AppError(UNPAID, 400);
  }
  const payment = await SalaryPayment.findOne({ _id: salary.paymentId, shopId: shop._id, salaryId: salary._id, status: "paid" });
  if (!payment) throw new AppError(UNPAID, 400);
  const employee = await Employee.findOne({ _id: salary.employeeId, shopId: shop._id }).select(
    "name phone role customRole joiningDate"
  );
  if (!employee) throw new AppError("Employee not found.", 404);
  return { user, shop, salary, payment, employee };
}

export async function getSalaryReceipt(userId, salaryId) {
  const context = await loadEligible(userId, salaryId);
  const receipt = await ensureReceipt(context.shop, context.salary, context.payment);
  return toView({ ...context, receipt });
}

async function loadLogo(shop) {
  const publicId = clean(shop.logo?.publicId);
  if (!publicId) return null;
  const filename = path.basename(publicId);
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return null;
  try {
    return await readFile(path.join(getLocalUploadRoot(), filename));
  } catch {
    return null;
  }
}

async function loadEmployeeEligible(employee, salaryId) {
  if (!mongoose.isValidObjectId(salaryId)) {
    throw new AppError("You don't have access to this receipt.", 404, true, { code: "RECEIPT_ACCESS_DENIED" });
  }
  const shop = await Shop.findById(employee.shopId);
  const user = shop ? await User.findById(shop.ownerId) : null;
  const salary = await SalaryRecord.findOne({ _id: salaryId, shopId: employee.shopId, employeeId: employee._id });
  if (!shop || !user || !salary) {
    throw new AppError("You don't have access to this receipt.", 404, true, { code: "RECEIPT_ACCESS_DENIED" });
  }
  if (salary.status !== "finalized" || salary.paymentStatus !== "paid") {
    const latest = await SalaryPayment.findOne({ shopId: shop._id, salaryId: salary._id }).sort({ createdAt: -1 });
    if (salary.status === "finalized" && latest?.status === "reversed") throw new AppError(REVERSED, 400);
    throw new AppError(UNPAID, 400);
  }
  const payment = await SalaryPayment.findOne({
    _id: salary.paymentId,
    shopId: shop._id,
    salaryId: salary._id,
    employeeId: employee._id,
    status: "paid",
  });
  if (!payment) throw new AppError(UNPAID, 400);
  return { user, shop, salary, payment, employee };
}

export async function getEmployeeSalaryReceipt(employee, salaryId) {
  const context = await loadEmployeeEligible(employee, salaryId);
  const receipt = await ensureReceipt(context.shop, context.salary, context.payment);
  return toView({ ...context, receipt });
}

export async function getEmployeeSalaryReceiptPdf(employee, salaryId) {
  const context = await loadEmployeeEligible(employee, salaryId);
  const receipt = await ensureReceipt(context.shop, context.salary, context.payment);
  const view = toView({ ...context, receipt });
  const logo = await loadLogo(context.shop);
  const buffer = await buildSalaryReceiptPdf(view, logo);
  return { filename: `HelperBook_Salary_Receipt_${receipt.receiptNumber}.pdf`, buffer };
}

export async function getSalaryReceiptPdf(userId, salaryId) {
  const context = await loadEligible(userId, salaryId);
  const receipt = await ensureReceipt(context.shop, context.salary, context.payment);
  const view = toView({ ...context, receipt });
  const logo = await loadLogo(context.shop);
  const buffer = await buildSalaryReceiptPdf(view, logo);
  return {
    filename: `HelperBook_Salary_Receipt_${receipt.receiptNumber}.pdf`,
    buffer,
  };
}
