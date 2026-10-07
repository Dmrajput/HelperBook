import mongoose from "mongoose";
import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const ATTENDANCE_COLLECTION = "attendances";
const SALARY_COLLECTION = "salaryrecords";
const ADVANCE_COLLECTION = "advances";
const KOLKATA_OFFSET = "+05:30";

const EMPTY_ATTENDANCE = {
  presentToday: 0,
  absentToday: 0,
  notMarkedToday: 0,
  isWorkingDay: true,
};

const EMPTY_SALARY = {
  pendingAmount: 0,
  pendingEmployees: 0,
};

const EMPTY_ADVANCE = {
  outstandingAmount: 0,
  employeesWithOutstanding: 0,
};

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

async function listCollectionNames() {
  const rows = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  return new Set(rows.map((row) => row.name));
}

function shopTimeZone(shop) {
  return shop?.settings?.timezone || EMPLOYEE_TIME_ZONE;
}

function weekdayKey(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(date).toLowerCase();
}

export function isShopWorkingDay(shop, date = new Date()) {
  const weekday = weekdayKey(date, shopTimeZone(shop));
  const days = Array.isArray(shop?.workingSchedule?.workingDays) ? shop.workingSchedule.workingDays : [];
  return days.includes(weekday);
}

function todayRange(timeZone, date = new Date()) {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const offset = timeZone === EMPLOYEE_TIME_ZONE ? KOLKATA_OFFSET : KOLKATA_OFFSET;
  return {
    start: new Date(`${key}T00:00:00.000${offset}`),
    end: new Date(`${key}T23:59:59.999${offset}`),
  };
}

function roundMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

export async function getEmployeeSummary(shopId) {
  const rows = await Employee.aggregate([
    { $match: { shopId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = { active: 0, inactive: 0 };
  for (const row of rows) {
    if (row._id === "active" || row._id === "inactive") {
      counts[row._id] = row.count;
    }
  }

  return {
    total: counts.active,
    active: counts.active,
    inactive: counts.inactive,
  };
}

export async function getRecentEmployees(shopId) {
  const employees = await Employee.find({ shopId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(5)
    .select("name role customRole status createdAt")
    .lean();

  return employees.map((employee) => ({
    id: String(employee._id),
    name: employee.name,
    role: employee.role,
    customRole: employee.customRole || null,
    status: employee.status,
    createdAt: new Date(employee.createdAt).toISOString(),
  }));
}

export async function getAttendanceSummary(shop, activeCount, collections) {
  const names = collections || (await listCollectionNames());
  const working = isShopWorkingDay(shop);
  const safeActive = Math.max(0, Number(activeCount) || 0);

  if (!names.has(ATTENDANCE_COLLECTION)) {
    return {
      presentToday: 0,
      absentToday: 0,
      notMarkedToday: working ? safeActive : 0,
      isWorkingDay: working,
    };
  }

  const { start, end } = todayRange(shopTimeZone(shop));
  const rows = await mongoose.connection
    .collection(ATTENDANCE_COLLECTION)
    .aggregate([
      {
        $match: {
          shopId: shop._id,
          date: { $gte: start, $lte: end },
          status: { $in: ["present", "absent"] },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          statuses: { $addToSet: "$status" },
        },
      },
    ])
    .toArray();

  let presentToday = 0;
  let absentToday = 0;

  if (rows.length > 0) {
    const activeEmployees = await Employee.find({
      _id: { $in: rows.map((row) => row._id) },
      shopId: shop._id,
      status: "active",
    })
      .select("_id")
      .lean();
    const activeIds = new Set(activeEmployees.map((employee) => String(employee._id)));

    for (const row of rows) {
      if (!activeIds.has(String(row._id))) {
        continue;
      }
      if (row.statuses.includes("present")) {
        presentToday += 1;
      } else if (row.statuses.includes("absent")) {
        absentToday += 1;
      }
    }
  }

  return {
    presentToday,
    absentToday,
    notMarkedToday: working ? Math.max(0, safeActive - presentToday - absentToday) : 0,
    isWorkingDay: working,
  };
}

async function sumByEmployee(collectionName, shopId, amountField) {
  const rows = await mongoose.connection
    .collection(collectionName)
    .aggregate([
      {
        $match: {
          shopId,
          [amountField]: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          amount: { $sum: `$${amountField}` },
        },
      },
    ])
    .toArray();

  const amount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return {
    amount: roundMoney(amount),
    employees: rows.filter((row) => Number(row.amount) > 0).length,
  };
}

export async function getSalaryPendingSummary(shopId, collections) {
  const names = collections || (await listCollectionNames());
  if (!names.has(SALARY_COLLECTION)) {
    return { ...EMPTY_SALARY };
  }

  const summary = await sumByEmployee(SALARY_COLLECTION, shopId, "pendingAmount");
  return {
    pendingAmount: summary.amount,
    pendingEmployees: summary.employees,
  };
}

export async function getSalarySummary(shopId, collections) {
  return getSalaryPendingSummary(shopId, collections);
}

export async function getAdvanceOutstandingSummary(shopId, collections) {
  const names = collections || (await listCollectionNames());
  if (!names.has(ADVANCE_COLLECTION)) {
    return { ...EMPTY_ADVANCE };
  }

  const summary = await sumByEmployee(ADVANCE_COLLECTION, shopId, "outstandingAmount");
  return {
    outstandingAmount: summary.amount,
    employeesWithOutstanding: summary.employees,
  };
}

export async function getAdvanceSummary(shopId, collections) {
  return getAdvanceOutstandingSummary(shopId, collections);
}

function toShopCard(shop) {
  return {
    id: String(shop._id),
    name: shop.name,
    logo: shop.logo?.url ? { url: shop.logo.url } : null,
    timezone: shopTimeZone(shop),
  };
}

export async function getDashboard(userId) {
  const shop = await requireShop(userId);
  const collections = await listCollectionNames();
  const [employees, recentEmployees] = await Promise.all([
    getEmployeeSummary(shop._id),
    getRecentEmployees(shop._id),
  ]);
  const [attendance, salary, advance] = await Promise.all([
    getAttendanceSummary(shop, employees.active, collections),
    getSalarySummary(shop._id, collections),
    getAdvanceSummary(shop._id, collections),
  ]);

  return {
    shop: toShopCard(shop),
    employees,
    attendance: attendance || { ...EMPTY_ATTENDANCE, notMarkedToday: employees.active },
    salary,
    advance,
    recentEmployees,
  };
}
