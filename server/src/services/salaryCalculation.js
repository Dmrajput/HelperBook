/**
 * Pure payroll calculation helpers.
 *
 * Intended monthly formula (working_days or calendar_days divisor):
 *   dailyRate = monthlyRate / divisor
 *   employmentDays = scheduled days in [joining..exit] ∩ payroll window (capped to today for current month)
 *   baseSalary = dailyRate * employmentDays          // prorated for mid-month join/exit / in-progress month
 *   attendanceDeduction = (absentDays + halfDays * 0.5) * dailyRate
 *   leaveDeduction = unpaidLeaveDays * dailyRate
 *   net = baseSalary - attendanceDeduction - leaveDeduction + bonus - otherDeductions - advanceDeduction
 *
 * Daily wage formula:
 *   baseSalary = dailyRate * (present + halfDays * 0.5 + paidLeave)
 *   attendanceDeduction = 0, leaveDeduction = 0 (unpaid days simply are not in base)
 *
 * Unmarked attendance days are intentionally not treated as absent (owner must mark absences).
 * Pre-joining / post-exit days are excluded via employment-window proration, not as "attendance deduction".
 */

import { DEDUCTIONS_EXCEED_SALARY } from "../constants/salary.js";
import { roundMoney } from "../validators/salary.validator.js";

export function roundDays(value) {
  const days = Number(value);
  if (!Number.isFinite(days)) {
    return 0;
  }
  // Avoid binary float artifacts (e.g. 1.005 * 100 → 100.4999…).
  return Number(`${Math.round(`${days}e2`)}e-2`);
}

export function calculateDailyRate(salaryRate, divisor) {
  if (!divisor) {
    return 0;
  }
  return Number(salaryRate) / Number(divisor);
}

export function calculatePayableDays({ presentDays = 0, halfDays = 0, paidLeaveDays = 0 }) {
  return roundDays(Number(presentDays) + Number(halfDays) * 0.5 + Number(paidLeaveDays));
}

export function calculateUnpaidAttendanceDays({ absentDays = 0, halfDays = 0 }) {
  return roundDays(Number(absentDays) + Number(halfDays) * 0.5);
}

/**
 * Monthly base is prorated to employmentDays in the payroll window.
 * Daily wage base is earned days only (present + half + paid leave).
 */
export function calculateBaseSalary({ salaryType, salaryRate, payableDays, employmentDays, dailyRate }) {
  if (salaryType === "daily") {
    return roundMoney(Number(salaryRate) * Number(payableDays));
  }
  return roundMoney(Number(dailyRate) * Number(employmentDays));
}

export function calculateAttendanceDeduction({ salaryType, unpaidAttendanceDays, dailyRate }) {
  if (salaryType === "daily") {
    return 0;
  }
  return roundMoney(Number(unpaidAttendanceDays) * Number(dailyRate));
}

export function calculateLeaveDeduction({ salaryType, unpaidLeaveDays, dailyRate }) {
  if (salaryType === "daily") {
    return 0;
  }
  return roundMoney(Number(unpaidLeaveDays) * Number(dailyRate));
}

export function calculateNetSalary({
  baseSalary,
  attendanceDeduction,
  leaveDeduction,
  bonus,
  deduction,
  advanceDeduction,
}) {
  const raw =
    Number(baseSalary)
    - Number(attendanceDeduction)
    - Number(leaveDeduction)
    + Number(bonus)
    - Number(deduction)
    - Number(advanceDeduction);
  const rounded = roundMoney(raw);
  if (rounded < 0) {
    return { netSalary: 0, warning: DEDUCTIONS_EXCEED_SALARY };
  }
  return { netSalary: rounded, warning: "" };
}

/**
 * Compute the numeric payroll snapshot from already-resolved day counts.
 * No database access — suitable for unit tests and shared service use.
 */
export function computePayrollAmounts({
  salaryType,
  salaryRate,
  divisor,
  employmentDays,
  presentDays = 0,
  halfDays = 0,
  absentDays = 0,
  paidLeaveDays = 0,
  unpaidLeaveDays = 0,
  bonus = 0,
  deduction = 0,
  advanceDeduction = 0,
}) {
  const dailyRate = calculateDailyRate(salaryRate, divisor);
  const payableDays = calculatePayableDays({ presentDays, halfDays, paidLeaveDays });
  const unpaidAttendanceDays = calculateUnpaidAttendanceDays({ absentDays, halfDays });
  const baseSalary = calculateBaseSalary({
    salaryType,
    salaryRate,
    payableDays,
    employmentDays,
    dailyRate,
  });
  const attendanceDeduction = calculateAttendanceDeduction({
    salaryType,
    unpaidAttendanceDays,
    dailyRate,
  });
  const leaveDeduction = calculateLeaveDeduction({
    salaryType,
    unpaidLeaveDays,
    dailyRate,
  });
  const net = calculateNetSalary({
    baseSalary,
    attendanceDeduction,
    leaveDeduction,
    bonus,
    deduction,
    advanceDeduction,
  });

  return {
    dailyRate,
    payableDays,
    unpaidAttendanceDays,
    baseSalary,
    attendanceDeduction,
    leaveDeduction,
    bonus: roundMoney(bonus),
    deduction: roundMoney(deduction),
    advanceDeduction: roundMoney(advanceDeduction),
    netSalary: net.netSalary,
    warning: net.warning,
  };
}
