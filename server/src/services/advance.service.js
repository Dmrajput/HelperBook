import mongoose from "mongoose";
import EmployeeAdvance from "../models/EmployeeAdvance.js";
import AdvanceTransaction from "../models/AdvanceTransaction.js";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { dateFromKey, keyFromDate } from "../utils/attendanceDate.js";
import { runInTransaction } from "../utils/mongoTransaction.js";
import { roundMoney } from "../validators/salary.validator.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const NOT_FOUND = "Advance could not be found.";
const INACTIVE = "Employee is inactive. New advances cannot be given.";
const BEFORE_JOINING = "Advance cannot be recorded before the employee's joining date.";
const SALARY_DEDUCTION_FAILED = "Advance deduction could not be processed.";

function inr(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function objectId(value) {
  return new mongoose.Types.ObjectId(String(value));
}

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

async function findOwnedEmployee(shopId, employeeId) {
  if (!mongoose.isValidObjectId(employeeId)) {
    throw new AppError("Please select an employee.", 400);
  }
  const employee = await Employee.findOne({ _id: employeeId, shopId });
  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }
  return employee;
}

function sessionQuery(query, session) {
  return session ? query.session(session) : query;
}

export async function getAdvanceBalance(employeeId, shopId, session) {
  return sumSigned({ shopId, employeeId }, session);
}

export async function getAdvanceBalanceByAdvanceId(advanceId, shopId, session) {
  return sumSigned({ shopId, advanceId }, session);
}

async function sumSigned(match, session) {
  const query = AdvanceTransaction.aggregate([
    {
      $match: {
        shopId: objectId(match.shopId),
        ...(match.employeeId ? { employeeId: objectId(match.employeeId) } : {}),
        ...(match.advanceId ? { advanceId: objectId(match.advanceId) } : {}),
      },
    },
    { $group: { _id: null, total: { $sum: "$signedAmount" } } },
  ]);
  const rows = await sessionQuery(query, session);
  return roundMoney(rows[0]?.total || 0);
}

async function summarizeMatch(match, session) {
  const query = AdvanceTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        outstanding: { $sum: "$signedAmount" },
        totalGiven: { $sum: { $cond: [{ $eq: ["$category", "given"] }, "$signedAmount", 0] } },
        totalRepaid: {
          $sum: { $cond: [{ $eq: ["$category", "repaid"] }, { $multiply: ["$signedAmount", -1] }, 0] },
        },
        totalSalaryDeducted: {
          $sum: { $cond: [{ $eq: ["$category", "salary"] }, { $multiply: ["$signedAmount", -1] }, 0] },
        },
      },
    },
  ]);
  const rows = await sessionQuery(query, session);
  const row = rows[0] || {};
  return {
    totalGiven: roundMoney(row.totalGiven || 0),
    totalRepaid: roundMoney(row.totalRepaid || 0),
    totalSalaryDeducted: roundMoney(row.totalSalaryDeducted || 0),
    outstanding: roundMoney(Math.max(0, row.outstanding || 0)),
  };
}

export async function getShopAdvanceSummary(shopId) {
  const rows = await AdvanceTransaction.aggregate([
    { $match: { shopId: objectId(shopId) } },
    {
      $group: {
        _id: "$employeeId",
        outstanding: { $sum: "$signedAmount" },
        totalGiven: { $sum: { $cond: [{ $eq: ["$category", "given"] }, "$signedAmount", 0] } },
        totalRepaid: {
          $sum: { $cond: [{ $eq: ["$category", "repaid"] }, { $multiply: ["$signedAmount", -1] }, 0] },
        },
        totalSalaryDeducted: {
          $sum: { $cond: [{ $eq: ["$category", "salary"] }, { $multiply: ["$signedAmount", -1] }, 0] },
        },
      },
    },
  ]);
  return rows.reduce(
    (totals, row) => {
      const outstanding = roundMoney(Math.max(0, row.outstanding || 0));
      totals.totalGiven = roundMoney(totals.totalGiven + Number(row.totalGiven || 0));
      totals.totalRepaid = roundMoney(totals.totalRepaid + Number(row.totalRepaid || 0));
      totals.totalSalaryDeducted = roundMoney(totals.totalSalaryDeducted + Number(row.totalSalaryDeducted || 0));
      totals.outstanding = roundMoney(totals.outstanding + outstanding);
      if (outstanding > 0) {
        totals.employeesWithOutstanding += 1;
      }
      return totals;
    },
    { totalGiven: 0, totalRepaid: 0, totalSalaryDeducted: 0, outstanding: 0, employeesWithOutstanding: 0 }
  );
}

async function refreshAdvance(advanceId, shopId, session) {
  const transactions = await sessionQuery(AdvanceTransaction.find({ shopId, advanceId }), session);
  const outstanding = roundMoney(transactions.reduce((sum, row) => sum + Number(row.signedAmount || 0), 0));
  if (outstanding < -0.001) {
    throw new AppError("Advance balance cannot be negative.", 409);
  }
  const safe = roundMoney(Math.max(0, outstanding));
  const opening = transactions.find((row) => row.type === "advance");
  const openingReversed = Boolean(
    opening &&
      transactions.some(
        (row) => row.type === "reversal" && String(row.reversedTransactionId) === String(opening._id)
      )
  );
  const status = safe === 0 ? (openingReversed ? "cancelled" : "closed") : "active";
  const closedAt = safe === 0 ? new Date() : null;
  await EmployeeAdvance.updateOne(
    { _id: advanceId, shopId },
    { $set: { remainingBalance: safe, status, closedAt } },
    writeOptions(session)
  );
  return { outstanding: safe, status, closedAt };
}

function writeOptions(session) {
  return session ? { session } : {};
}

async function insertTransaction(doc, session) {
  const [created] = await AdvanceTransaction.create([doc], writeOptions(session));
  return created;
}

function toPublicTransaction(transaction) {
  return {
    id: String(transaction._id),
    advanceId: String(transaction.advanceId),
    employeeId: String(transaction.employeeId),
    type: transaction.type,
    amount: transaction.amount,
    signedAmount: transaction.signedAmount,
    date: keyFromDate(transaction.date),
    source: transaction.source,
    salaryRecordId: transaction.salaryRecordId ? String(transaction.salaryRecordId) : null,
    notes: transaction.notes || "",
    paymentMethod: transaction.paymentMethod || "",
    reversed: Boolean(transaction.reversed),
    reversedTransactionId: transaction.reversedTransactionId ? String(transaction.reversedTransactionId) : null,
    createdAt: new Date(transaction.createdAt).toISOString(),
  };
}

function toPublicAdvance(advance, sequence) {
  const settings = advance.repaymentSettings || {};
  return {
    id: String(advance._id),
    employeeId: String(advance.employeeId),
    originalAmount: advance.originalAmount,
    outstandingBalance: advance.remainingBalance,
    status: advance.status,
    date: keyFromDate(advance.date),
    notes: advance.notes || "",
    sequence: sequence || null,
    label: sequence ? `Advance #${sequence}` : "Advance",
    repaymentSettings: {
      method: settings.method || null,
      monthlyAmount: settings.monthlyAmount || 0,
    },
    closedAt: advance.closedAt ? new Date(advance.closedAt).toISOString() : null,
    createdAt: new Date(advance.createdAt).toISOString(),
  };
}

async function sequenceMap(shopId, employeeId, session) {
  const advances = await sessionQuery(
    EmployeeAdvance.find({ shopId, employeeId }).sort({ date: 1, createdAt: 1 }),
    session
  );
  return new Map(advances.map((advance, index) => [String(advance._id), index + 1]));
}

async function findAdvance(shopId, advanceId, employeeId, session) {
  if (!mongoose.isValidObjectId(advanceId)) {
    throw new AppError(NOT_FOUND, 404);
  }
  const advance = await sessionQuery(EmployeeAdvance.findOne({ _id: advanceId, shopId, employeeId }), session);
  if (!advance) {
    throw new AppError(NOT_FOUND, 404);
  }
  return advance;
}

function duplicateRequest(error) {
  return error?.code === 11000 && String(error?.message || "").includes("requestId");
}

export async function giveAdvance(userId, input) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, input.employeeId);
  if (employee.status !== "active") {
    throw new AppError(INACTIVE, 400);
  }
  if (input.key < keyFromDate(employee.joiningDate)) {
    throw new AppError(BEFORE_JOINING, 400);
  }
  if (input.requestId) {
    const existing = await EmployeeAdvance.findOne({ shopId: shop._id, requestId: input.requestId });
    if (existing) {
      const sequences = await sequenceMap(shop._id, employee._id);
      const outstanding = await getAdvanceBalance(employee._id, shop._id);
      return {
        advance: toPublicAdvance(existing, sequences.get(String(existing._id))),
        outstanding,
      };
    }
  }

  try {
    return await runInTransaction(async (session) => {
      const [advance] = await EmployeeAdvance.create(
        [
          {
            shopId: shop._id,
            employeeId: employee._id,
            originalAmount: input.amount,
            remainingBalance: input.amount,
            status: "active",
            date: input.date,
            notes: input.notes,
            repaymentSettings: input.repaymentSettings?.method
              ? input.repaymentSettings
              : { monthlyAmount: 0 },
            createdBy: userId,
            requestId: input.requestId || undefined,
            currency: "INR",
          },
        ],
        writeOptions(session)
      );
      await insertTransaction(
        {
          shopId: shop._id,
          employeeId: employee._id,
          advanceId: advance._id,
          type: "advance",
          category: "given",
          amount: input.amount,
          signedAmount: input.amount,
          date: input.date,
          source: "manual",
          notes: input.notes,
          createdBy: userId,
          reversed: false,
        },
        session
      );
      const sequences = await sequenceMap(shop._id, employee._id, session);
      const outstanding = await getAdvanceBalance(employee._id, shop._id, session);
      return {
        advance: toPublicAdvance(advance, sequences.get(String(advance._id))),
        outstanding,
      };
    });
  } catch (error) {
    if (input.requestId && duplicateRequest(error)) {
      const existing = await EmployeeAdvance.findOne({ shopId: shop._id, requestId: input.requestId });
      const sequences = await sequenceMap(shop._id, employee._id);
      return {
        advance: toPublicAdvance(existing, sequences.get(String(existing._id))),
        outstanding: await getAdvanceBalance(employee._id, shop._id),
      };
    }
    throw error;
  }
}

async function lockAndTake(advance, amount, session) {
  const updated = await EmployeeAdvance.findOneAndUpdate(
    { _id: advance._id, shopId: advance.shopId, remainingBalance: { $gte: amount } },
    { $inc: { remainingBalance: -amount } },
    { ...writeOptions(session), returnDocument: "after" }
  );
  if (!updated) {
    throw new AppError("The outstanding balance changed. Please try again.", 409);
  }
  return updated;
}

async function applyToAdvances({ shop, employee, amount, date, notes, source, type, category, userId, session, advanceId, salaryRecordId, paymentMethod, requestId }) {
  const starting = advanceId
    ? [await findAdvance(shop._id, advanceId, employee._id, session)]
    : await sessionQuery(
        EmployeeAdvance.find({ shopId: shop._id, employeeId: employee._id, status: "active" }).sort({ date: 1, createdAt: 1 }),
        session
      );
  for (const advance of starting) {
    await refreshAdvance(advance._id, shop._id, session);
  }
  const advances = advanceId
    ? [await findAdvance(shop._id, advanceId, employee._id, session)]
    : await sessionQuery(
        EmployeeAdvance.find({ shopId: shop._id, employeeId: employee._id, status: "active" }).sort({ date: 1, createdAt: 1 }),
        session
      );
  if (advanceId && advances[0].status !== "active") {
    throw new AppError("This advance is not active.", 400);
  }
  const outstanding = advanceId
    ? roundMoney(advances[0].remainingBalance)
    : roundMoney(advances.reduce((sum, advance) => sum + Number(advance.remainingBalance || 0), 0));
  if (amount > outstanding) {
    throw new AppError(`Repayment cannot exceed the outstanding balance of ${inr(outstanding)}.`, 400);
  }

  let left = amount;
  const created = [];
  for (const advance of advances) {
    if (left <= 0) {
      break;
    }
    if (keyFromDate(date) < keyFromDate(advance.date)) {
      if (type === "salary_deduction") {
        continue;
      }
      throw new AppError("Repayment cannot be recorded before the advance date.", 400);
    }
    const take = roundMoney(Math.min(left, advance.remainingBalance));
    if (take <= 0) {
      continue;
    }
    await lockAndTake(advance, take, session);
    const transaction = await insertTransaction(
      {
        shopId: shop._id,
        employeeId: employee._id,
        advanceId: advance._id,
        type,
        category,
        amount: take,
        signedAmount: roundMoney(-take),
        date,
        source,
        salaryRecordId: salaryRecordId || null,
        notes,
        paymentMethod: paymentMethod || "",
        createdBy: userId,
        reversed: false,
        requestId: requestId && created.length === 0 ? requestId : undefined,
      },
      session
    );
    const refreshed = await refreshAdvance(advance._id, shop._id, session);
    created.push({ transaction, advanceId: String(advance._id), amount: take, ...refreshed });
    left = roundMoney(left - take);
  }
  if (left > 0) {
    throw new AppError(`Repayment cannot exceed the outstanding balance of ${inr(outstanding)}.`, 400);
  }
  return created;
}

export async function recordRepayment(userId, input) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, input.employeeId);
  if (input.requestId) {
    const existing = await AdvanceTransaction.findOne({ shopId: shop._id, requestId: input.requestId, type: "repayment" });
    if (existing) {
      const advance = await EmployeeAdvance.findOne({ _id: existing.advanceId, shopId: shop._id });
      return {
        amount: input.amount,
        remainingBalance: advance?.remainingBalance ?? 0,
        status: advance?.status || "active",
        allocations: [{ advanceId: String(existing.advanceId), amount: existing.amount }],
      };
    }
  }

  return runInTransaction(async (session) => {
    const created = await applyToAdvances({
      shop,
      employee,
      amount: input.amount,
      date: input.date,
      notes: input.notes,
      source: "manual",
      type: "repayment",
      category: "repaid",
      userId,
      session,
      advanceId: input.advanceId,
      paymentMethod: input.paymentMethod,
      requestId: input.requestId,
    });
    const employeeOutstanding = await getAdvanceBalance(employee._id, shop._id, session);
    const primary = created[0];
    const remainingBalance = input.advanceId ? primary.outstanding : employeeOutstanding;
    return {
      amount: input.amount,
      remainingBalance,
      status: remainingBalance === 0 ? "closed" : "active",
      allocations: created.map((row) => ({ advanceId: row.advanceId, amount: row.amount, status: row.status })),
    };
  });
}

export async function recordAdjustment(userId, input) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, input.employeeId);
  return runInTransaction(async (session) => {
    const advance = await findAdvance(shop._id, input.advanceId, employee._id, session);
    if (advance.status === "cancelled") {
      throw new AppError("This advance is cancelled.", 400);
    }
    if (keyFromDate(input.date) < keyFromDate(advance.date)) {
      throw new AppError("Adjustment cannot be recorded before the advance date.", 400);
    }
    const signed = input.direction === "decrease" ? roundMoney(-input.amount) : input.amount;
    if (input.direction === "decrease") {
      await lockAndTake(advance, input.amount, session);
    }
    await insertTransaction(
      {
        shopId: shop._id,
        employeeId: employee._id,
        advanceId: advance._id,
        type: "adjustment",
        category: "adjustment",
        amount: input.amount,
        signedAmount: signed,
        date: input.date,
        source: "manual",
        notes: input.reason,
        createdBy: userId,
        reversed: false,
        requestId: input.requestId || undefined,
      },
      session
    );
    const refreshed = await refreshAdvance(advance._id, shop._id, session);
    return {
      outstandingBalance: refreshed.outstanding,
      status: refreshed.status,
    };
  });
}

export async function reverseTransaction(userId, transactionId) {
  const shop = await requireShop(userId);
  return runInTransaction(async (session) => {
    const original = await sessionQuery(
      AdvanceTransaction.findOne({ _id: transactionId, shopId: shop._id }),
      session
    );
    if (!original) {
      throw new AppError("Advance transaction could not be found.", 404);
    }
    if (original.type === "salary_deduction") {
      throw new AppError("Reopen the salary before changing this deduction.", 409);
    }
    if (original.type === "reversal" || original.reversed) {
      throw new AppError("This transaction has already been reversed.", 409);
    }
    const reversal = await insertTransaction(
      {
        shopId: shop._id,
        employeeId: original.employeeId,
        advanceId: original.advanceId,
        type: "reversal",
        category: original.category,
        amount: original.amount,
        signedAmount: roundMoney(-original.signedAmount),
        date: original.date,
        source: "system",
        notes: "Reversal",
        createdBy: userId,
        reversed: false,
        reversedTransactionId: original._id,
      },
      session
    );
    original.reversed = true;
    await original.save(writeOptions(session));
    const refreshed = await refreshAdvance(original.advanceId, shop._id, session);
    return {
      transaction: toPublicTransaction(reversal),
      outstandingBalance: refreshed.outstanding,
      status: refreshed.status,
    };
  });
}

export async function planSalaryDeduction({ shopId, employeeId, requested, availableSalary, session }) {
  const outstanding = roundMoney(Math.max(0, await getAdvanceBalance(employeeId, shopId, session)));
  let configured = 0;
  if (requested === undefined) {
    const advances = await sessionQuery(
      EmployeeAdvance.find({ shopId, employeeId, status: "active" }),
      session
    );
    configured = roundMoney(
      advances.reduce((sum, advance) => {
        if (advance.repaymentSettings?.method === "salary_deduction") {
          return sum + Number(advance.repaymentSettings.monthlyAmount || 0);
        }
        return sum;
      }, 0)
    );
  }
  let amount = roundMoney(requested === undefined ? configured : requested);
  const warnings = [];
  if (amount > outstanding) {
    amount = outstanding;
    warnings.push("Advance deduction was limited to the outstanding balance.");
  }
  const available = roundMoney(Math.max(0, availableSalary));
  if (amount > available) {
    amount = available;
    warnings.push("Advance deduction is limited because the employee's salary is insufficient.");
  }
  return {
    outstanding,
    advanceDeduction: roundMoney(Math.max(0, amount)),
    warning: warnings.join(" "),
  };
}

export async function postSalaryDeduction({ shopId, employeeId, salaryRecordId, amount, date, userId, session }) {
  const deduction = roundMoney(amount);
  if (deduction <= 0) {
    return [];
  }
  const existing = await sessionQuery(
    AdvanceTransaction.find({
      shopId,
      salaryRecordId,
      type: "salary_deduction",
      reversed: false,
    }),
    session
  );
  const existingSum = roundMoney(existing.reduce((sum, row) => sum + Number(row.amount || 0), 0));
  if (existing.length > 0) {
    if (existingSum === deduction) {
      return existing;
    }
    throw new AppError(SALARY_DEDUCTION_FAILED, 409);
  }
  const shop = { _id: shopId };
  const employee = { _id: employeeId };
  try {
    return await applyToAdvances({
      shop,
      employee,
      amount: deduction,
      date,
      notes: "Salary deduction",
      source: "salary",
      type: "salary_deduction",
      category: "salary",
      userId,
      session,
      salaryRecordId,
    });
  } catch (error) {
    if (error instanceof AppError && error.message.startsWith("Repayment cannot exceed")) {
      throw new AppError(SALARY_DEDUCTION_FAILED, 409);
    }
    throw error;
  }
}

export async function reverseSalaryDeductions({ shopId, salaryRecordId, userId, session }) {
  const rows = await sessionQuery(
    AdvanceTransaction.find({ shopId, salaryRecordId, type: "salary_deduction", reversed: false }),
    session
  );
  for (const original of rows) {
    await insertTransaction(
      {
        shopId,
        employeeId: original.employeeId,
        advanceId: original.advanceId,
        type: "reversal",
        category: "salary",
        amount: original.amount,
        signedAmount: roundMoney(-original.signedAmount),
        date: original.date,
        source: "system",
        salaryRecordId,
        notes: "Salary reopened",
        createdBy: userId,
        reversed: false,
        reversedTransactionId: original._id,
      },
      session
    );
    original.reversed = true;
    await original.save(writeOptions(session));
    await refreshAdvance(original.advanceId, shopId, session);
  }
  return rows.length;
}

export async function updateRepaymentSettings(userId, advanceId, settings) {
  const shop = await requireShop(userId);
  const advance = await EmployeeAdvance.findOne({ _id: advanceId, shopId: shop._id });
  if (!advance) {
    throw new AppError(NOT_FOUND, 404);
  }
  if (advance.status !== "active") {
    throw new AppError("Repayment settings can be changed while the advance is active.", 400);
  }
  advance.repaymentSettings = settings?.method
    ? { method: settings.method, monthlyAmount: settings.monthlyAmount }
    : { monthlyAmount: 0 };
  await advance.save();
  const sequences = await sequenceMap(shop._id, advance.employeeId);
  return { advance: toPublicAdvance(advance, sequences.get(String(advance._id))) };
}

export async function getAdvance(userId, advanceId) {
  const shop = await requireShop(userId);
  const advance = await EmployeeAdvance.findOne({ _id: advanceId, shopId: shop._id });
  if (!advance) {
    throw new AppError(NOT_FOUND, 404);
  }
  await refreshAdvance(advance._id, shop._id);
  const fresh = await EmployeeAdvance.findOne({ _id: advanceId, shopId: shop._id });
  const sequences = await sequenceMap(shop._id, fresh.employeeId);
  const summary = await summarizeMatch({ shopId: objectId(shop._id), advanceId: objectId(fresh._id) });
  return {
    advance: toPublicAdvance(fresh, sequences.get(String(fresh._id))),
    summary,
  };
}

export async function getEmployeeAdvances(userId, employeeId, query) {
  const shop = await requireShop(userId);
  const employee = await findOwnedEmployee(shop._id, employeeId);
  const filter = { shopId: shop._id, employeeId: employee._id };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = dateFromKey(query.startDate);
    if (query.endDate) filter.date.$lte = dateFromKey(query.endDate);
  }
  const advances = await EmployeeAdvance.find({ shopId: shop._id, employeeId: employee._id }).sort({ date: 1, createdAt: 1 });
  for (const advance of advances) {
    await refreshAdvance(advance._id, shop._id);
  }
  const fresh = await EmployeeAdvance.find(filter).sort({ date: 1, createdAt: 1 });
  const sequences = await sequenceMap(shop._id, employee._id);
  const summary = await summarizeMatch({ shopId: objectId(shop._id), employeeId: objectId(employee._id) });
  const start = (query.page - 1) * query.limit;
  const pageItems = fresh.slice(start, start + query.limit);
  return {
    employee: { id: String(employee._id), name: employee.name, status: employee.status },
    summary,
    advances: pageItems.map((advance) => toPublicAdvance(advance, sequences.get(String(advance._id)))),
    page: query.page,
    limit: query.limit,
    total: fresh.length,
  };
}

export async function listAdvances(userId, query) {
  const shop = await requireShop(userId);
  const summary = await getShopAdvanceSummary(shop._id);
  const rows = await AdvanceTransaction.aggregate([
    { $match: { shopId: objectId(shop._id) } },
    {
      $group: {
        _id: "$employeeId",
        outstanding: { $sum: "$signedAmount" },
        totalGiven: { $sum: { $cond: [{ $eq: ["$category", "given"] }, "$signedAmount", 0] } },
        totalRepaid: {
          $sum: { $cond: [{ $eq: ["$category", "repaid"] }, { $multiply: ["$signedAmount", -1] }, 0] },
        },
        totalSalaryDeducted: {
          $sum: { $cond: [{ $eq: ["$category", "salary"] }, { $multiply: ["$signedAmount", -1] }, 0] },
        },
      },
    },
  ]);
  const employees = await Employee.find({ shopId: shop._id }).select("name status").sort({ name: 1 });
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  let items = employees
    .filter((employee) => !query.employeeId || String(employee._id) === query.employeeId)
    .filter((employee) => !query.search || employee.name.toLowerCase().includes(query.search.toLowerCase()))
    .map((employee) => {
      const row = byId.get(String(employee._id));
      return {
        employee: { id: String(employee._id), name: employee.name, status: employee.status },
        outstanding: roundMoney(Math.max(0, row?.outstanding || 0)),
        totalGiven: roundMoney(row?.totalGiven || 0),
        totalRepaid: roundMoney(row?.totalRepaid || 0),
        totalSalaryDeducted: roundMoney(row?.totalSalaryDeducted || 0),
      };
    })
    .filter((item) => byId.has(item.employee.id));
  if (query.status === "active") {
    items = items.filter((item) => item.outstanding > 0);
  } else if (query.status === "closed") {
    items = items.filter((item) => item.outstanding === 0 && byId.has(item.employee.id));
  }
  const start = (query.page - 1) * query.limit;
  return {
    summary,
    employees: items.slice(start, start + query.limit),
    page: query.page,
    limit: query.limit,
    total: items.length,
  };
}

async function listTransactions(filter, query) {
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = dateFromKey(query.startDate);
    if (query.endDate) filter.date.$lte = dateFromKey(query.endDate);
  }
  if (query.type) {
    filter.type = query.type;
  }
  const skip = (query.page - 1) * query.limit;
  const [transactions, total] = await Promise.all([
    AdvanceTransaction.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(query.limit),
    AdvanceTransaction.countDocuments(filter),
  ]);
  return {
    transactions: transactions.map(toPublicTransaction),
    page: query.page,
    limit: query.limit,
    total,
  };
}

export async function getEmployeeTransactions(userId, employeeId, query) {
  const shop = await requireShop(userId);
  await findOwnedEmployee(shop._id, employeeId);
  return listTransactions({ shopId: shop._id, employeeId }, query);
}

export async function getAdvanceTransactions(userId, advanceId, query) {
  const shop = await requireShop(userId);
  const advance = await EmployeeAdvance.findOne({ _id: advanceId, shopId: shop._id });
  if (!advance) {
    throw new AppError(NOT_FOUND, 404);
  }
  return listTransactions({ shopId: shop._id, advanceId: advance._id }, query);
}
