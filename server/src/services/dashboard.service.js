import { EMPLOYEE_TIME_ZONE } from "../constants/employee.js";
import { getShopAdvanceSummary } from "./advance.service.js";
import { getRecentSalaryPayments, summarizeUnpaidSalaries } from "./salaryPayment.service.js";
import { approvedEmployeeIdsOnDate, countPendingLeaves } from "./leave.service.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { dateFromKey, todayKey } from "../utils/attendanceDate.js";
import { AppError } from "../utils/appError.js";
import { getDashboardSubscription } from "./subscription.service.js";

const SHOP_REQUIRED = "Shop setup is required before managing employees.";
const EMPTY_ATTENDANCE = {
  presentToday: 0,
  absentToday: 0,
  halfDayToday: 0,
  leaveToday: 0,
  notMarkedToday: 0,
  isWorkingDay: true,
};

const EMPTY_SALARY = {
  pendingAmount: 0,
  pendingEmployees: 0,
  hasFinalized: false,
  allPaid: false,
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

export async function getAttendanceSummary(shop) {
  const working = isShopWorkingDay(shop);
  const timeZone = shopTimeZone(shop);
  const storedToday = dateFromKey(todayKey(timeZone));
  const [records, activeEmployees, onLeave] = await Promise.all([
    Attendance.find({ shopId: shop._id, date: storedToday }).select("employeeId status").lean(),
    Employee.find({ shopId: shop._id, status: "active" }).select("_id").lean(),
    approvedEmployeeIdsOnDate(shop._id, storedToday),
  ]);
  const activeIds = new Set(activeEmployees.map((employee) => String(employee._id)));
  const markedIds = new Set();
  const counts = { presentToday: 0, absentToday: 0, halfDayToday: 0, leaveToday: 0 };
  let marked = 0;

  for (const record of records) {
    const employeeId = String(record.employeeId);
    if (!activeIds.has(employeeId)) {
      continue;
    }
    markedIds.add(employeeId);
    marked += 1;
    if (record.status === "present") counts.presentToday += 1;
    else if (record.status === "absent") counts.absentToday += 1;
    else if (record.status === "half_day") counts.halfDayToday += 1;
    else if (record.status === "leave") counts.leaveToday += 1;
  }
  for (const employeeId of activeIds) {
    if (markedIds.has(employeeId) || !onLeave.has(employeeId)) continue;
    marked += 1;
    counts.leaveToday += 1;
  }

  return {
    ...counts,
    notMarkedToday: working ? Math.max(0, activeIds.size - marked) : 0,
    isWorkingDay: working,
  };
}

export async function getSalaryPendingSummary(shopId) {
  return summarizeUnpaidSalaries(shopId);
}

export async function getSalarySummary(shopId) {
  return getSalaryPendingSummary(shopId);
}

export async function getAdvanceOutstandingSummary(shopId) {
  const summary = await getShopAdvanceSummary(shopId);
  return {
    outstandingAmount: summary.outstanding,
    employeesWithOutstanding: summary.employeesWithOutstanding,
  };
}

export async function getAdvanceSummary(shopId) {
  return getAdvanceOutstandingSummary(shopId);
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
  const [employees, recentEmployees] = await Promise.all([
    getEmployeeSummary(shop._id),
    getRecentEmployees(shop._id),
  ]);
  const [attendance, salary, advance, pendingRequests, recentPayments] = await Promise.all([
    getAttendanceSummary(shop),
    getSalarySummary(shop._id),
    getAdvanceSummary(shop._id),
    countPendingLeaves(shop._id),
    getRecentSalaryPayments(shop._id),
  ]);

  return {
    shop: toShopCard(shop),
    employees,
    attendance: attendance || { ...EMPTY_ATTENDANCE, notMarkedToday: employees.active },
    salary,
    advance,
    leave: { pendingRequests },
    recentEmployees,
    recentPayments,
    subscription: await getDashboardSubscription(userId),
  };
}
