import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateAttendanceDeduction,
  calculateBaseSalary,
  calculateDailyRate,
  calculateLeaveDeduction,
  calculateNetSalary,
  calculatePayableDays,
  calculateUnpaidAttendanceDays,
  computePayrollAmounts,
  roundDays,
} from "../src/services/salaryCalculation.js";
import { roundMoney } from "../src/validators/salary.validator.js";

describe("salaryCalculation helpers", () => {
  it("rounds money to two decimals without floating drift", () => {
    assert.equal(roundMoney(100001 / 27), 3703.74);
    assert.equal(roundMoney(14 * (100001 / 27)), 51852.37);
    assert.equal(roundMoney(0.1 + 0.2), 0.3);
  });

  it("computes payable and unpaid attendance days", () => {
    assert.equal(calculatePayableDays({ presentDays: 20, halfDays: 2, paidLeaveDays: 1 }), 22);
    assert.equal(calculateUnpaidAttendanceDays({ absentDays: 3, halfDays: 1 }), 3.5);
    assert.equal(roundDays(1.005), 1.01);
  });

  it("daily rate uses configured divisor", () => {
    assert.equal(calculateDailyRate(27000, 27), 1000);
    assert.equal(calculateDailyRate(31000, 31), 1000);
    assert.equal(calculateDailyRate(10000, 0), 0);
  });
});

describe("monthly salary — full attendance", () => {
  it("pays full monthly rate when employed all working days and no absences", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 27000,
      divisor: 27,
      employmentDays: 27,
      presentDays: 27,
      halfDays: 0,
      absentDays: 0,
    });
    assert.equal(result.baseSalary, 27000);
    assert.equal(result.attendanceDeduction, 0);
    assert.equal(result.netSalary, 27000);
  });
});

describe("monthly salary — absences and half days", () => {
  it("deducts one absent day from a full-month employee", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 27000,
      divisor: 27,
      employmentDays: 27,
      presentDays: 26,
      absentDays: 1,
    });
    assert.equal(result.attendanceDeduction, 1000);
    assert.equal(result.netSalary, 26000);
  });

  it("deducts half of daily rate for a half day", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 27000,
      divisor: 27,
      employmentDays: 27,
      presentDays: 26,
      halfDays: 1,
      absentDays: 0,
    });
    assert.equal(result.attendanceDeduction, 500);
    assert.equal(result.netSalary, 26500);
  });

  it("does not double-count unpaid leave as attendance absence", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 27000,
      divisor: 27,
      employmentDays: 27,
      presentDays: 25,
      absentDays: 0,
      unpaidLeaveDays: 2,
    });
    assert.equal(result.attendanceDeduction, 0);
    assert.equal(result.leaveDeduction, 2000);
    assert.equal(result.netSalary, 25000);
  });
});

describe("monthly salary — mid-month joining / current month window", () => {
  it("prorates base to employment days and does not treat pre-joining as attendance deduction", () => {
    // Regression: old formula used full base 100001 and deducted 14 pre-joining days
    // as attendance (₹51,852.37), overpaying the remainder of the month.
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 100001,
      divisor: 27,
      employmentDays: 1,
      presentDays: 1,
      halfDays: 0,
      absentDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
    });

    assert.equal(result.dailyRate, 100001 / 27);
    assert.equal(result.baseSalary, 3703.74);
    assert.equal(result.attendanceDeduction, 0);
    assert.equal(result.leaveDeduction, 0);
    assert.equal(result.netSalary, 3703.74);

    // Old incorrect reconciliation (documented, must not return):
    const oldAttendance = roundMoney(14 * (100001 / 27));
    const oldNet = roundMoney(100001 - oldAttendance);
    assert.equal(oldAttendance, 51852.37);
    assert.equal(oldNet, 48148.63);
    assert.notEqual(result.netSalary, oldNet);
  });

  it("prorates a past mid-month join across remaining working days with no absences", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 100001,
      divisor: 27,
      employmentDays: 13,
      presentDays: 13,
      absentDays: 0,
    });
    assert.equal(result.baseSalary, roundMoney((100001 / 27) * 13));
    assert.equal(result.attendanceDeduction, 0);
    assert.equal(result.netSalary, result.baseSalary);
  });
});

describe("daily wage", () => {
  it("pays only marked payable days and skips attendance/leave deductions", () => {
    const result = computePayrollAmounts({
      salaryType: "daily",
      salaryRate: 600,
      divisor: 27,
      employmentDays: 20,
      presentDays: 18,
      halfDays: 2,
      absentDays: 3,
      unpaidLeaveDays: 1,
    });
    assert.equal(result.payableDays, 19);
    assert.equal(result.baseSalary, 11400);
    assert.equal(result.attendanceDeduction, 0);
    assert.equal(result.leaveDeduction, 0);
    assert.equal(result.netSalary, 11400);
  });

  it("returns zero for zero payable days", () => {
    const result = computePayrollAmounts({
      salaryType: "daily",
      salaryRate: 600,
      divisor: 27,
      employmentDays: 10,
      presentDays: 0,
    });
    assert.equal(result.netSalary, 0);
  });
});

describe("bonus, deductions and advances", () => {
  it("applies bonus once and deductions once", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 30000,
      divisor: 30,
      employmentDays: 30,
      presentDays: 30,
      bonus: 1500,
      deduction: 500,
      advanceDeduction: 1000,
    });
    assert.equal(result.netSalary, 30000 + 1500 - 500 - 1000);
  });

  it("clamps net at zero when deductions exceed available salary", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 10000,
      divisor: 30,
      employmentDays: 30,
      presentDays: 30,
      deduction: 20000,
    });
    assert.equal(result.netSalary, 0);
    assert.match(result.warning, /exceed/i);
  });

  it("handles zero bonus and zero deduction", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 10000,
      divisor: 20,
      employmentDays: 20,
      presentDays: 20,
      bonus: 0,
      deduction: 0,
      advanceDeduction: 0,
    });
    assert.equal(result.netSalary, 10000);
  });
});

describe("component helpers keep contracts", () => {
  it("monthly base uses employment days, daily uses payable days", () => {
    assert.equal(
      calculateBaseSalary({
        salaryType: "monthly",
        salaryRate: 27000,
        payableDays: 5,
        employmentDays: 27,
        dailyRate: 1000,
      }),
      27000
    );
    assert.equal(
      calculateBaseSalary({
        salaryType: "daily",
        salaryRate: 500,
        payableDays: 10,
        employmentDays: 20,
        dailyRate: 500,
      }),
      5000
    );
  });

  it("attendance and leave deductions are monthly-only", () => {
    assert.equal(calculateAttendanceDeduction({ salaryType: "daily", unpaidAttendanceDays: 5, dailyRate: 100 }), 0);
    assert.equal(calculateLeaveDeduction({ salaryType: "daily", unpaidLeaveDays: 2, dailyRate: 100 }), 0);
    assert.equal(calculateAttendanceDeduction({ salaryType: "monthly", unpaidAttendanceDays: 2, dailyRate: 100 }), 200);
    assert.equal(calculateLeaveDeduction({ salaryType: "monthly", unpaidLeaveDays: 1.5, dailyRate: 100 }), 150);
  });

  it("net salary formula matches component sum", () => {
    const net = calculateNetSalary({
      baseSalary: 10000,
      attendanceDeduction: 1000,
      leaveDeduction: 500,
      bonus: 200,
      deduction: 100,
      advanceDeduction: 300,
    });
    assert.equal(net.netSalary, 8300);
  });
});

describe("invalid / edge configurations", () => {
  it("handles missing divisor for monthly without throwing", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 10000,
      divisor: 0,
      employmentDays: 10,
      presentDays: 10,
    });
    assert.equal(result.baseSalary, 0);
    assert.equal(result.netSalary, 0);
  });

  it("handles decimal salary amounts", () => {
    const result = computePayrollAmounts({
      salaryType: "monthly",
      salaryRate: 10000.55,
      divisor: 20,
      employmentDays: 20,
      presentDays: 19,
      absentDays: 1,
    });
    assert.equal(result.baseSalary, 10000.55);
    assert.equal(result.attendanceDeduction, roundMoney(10000.55 / 20));
    assert.equal(result.netSalary, roundMoney(10000.55 - 10000.55 / 20));
  });
});
