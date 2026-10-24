# Salary calculation specification

Source of truth: `server/src/services/salaryCalculation.js` (pure math) and `server/src/services/salary.service.js` (`buildSnapshot`).

## Divisor

- Default mode: `working_days` (shop setting `attendanceDeductionMode`, overridable per draft).
- Alternate mode: `calendar_days`.
- `dailyRate = salaryRate / divisor`.

## Employment window

For the selected payroll month:

- Starts at max(month start, joining date).
- Ends at min(month end, deactivation date, **today** when calculating the current month).

`employmentDays` = scheduled days (per mode) inside that window.

Pre-joining and post-exit days are **excluded from base pay**. They are **not** counted as absences.

## Monthly salary

```
baseSalary           = dailyRate × employmentDays
attendanceDeduction  = (absentDays + halfDays × 0.5) × dailyRate
leaveDeduction       = unpaidLeaveDays × dailyRate
netSalary            = baseSalary − attendanceDeduction − leaveDeduction
                     + bonuses − otherDeductions − advanceDeduction
```

## Daily wage

```
payableDays = presentDays + halfDays × 0.5 + paidLeaveDays
baseSalary  = dailyRate × payableDays
attendanceDeduction = 0
leaveDeduction      = 0
netSalary   = baseSalary + bonuses − otherDeductions − advanceDeduction
```

## Leave

- Approved paid leave counts toward payable days (daily) / is not deducted (monthly).
- Approved unpaid leave + legacy attendance `leave` days feed `leaveDays`.
- Manual paid-leave override cannot go below approved paid leave or above total leave.
- Unpaid leave is deducted only via `leaveDeduction` (never also as absence).

## Unmarked attendance

Unmarked days are **not** treated as absent. Owners must mark absences explicitly. This is intentional for small-shop workflows but means a finalized past month with sparse marking can overpay if absences were never recorded.

## Advances

Advance deduction is planned from outstanding Khata and capped by available salary after attendance/leave/bonus/other deductions. It is applied once in net salary and posted on finalize.

## Ambiguities / policy notes

1. Hourly wages are not supported.
2. Holidays are not a separate calendar — only shop `workingSchedule.workingDays`.
3. Unmarked ≠ absent (lenient). Documented risk for past months.
4. Prior behavior deducted pre-joining days from a **full** monthly base while still paying remaining future days in the current month. That overpaid mid-month joins; fixed by employment-window proration (2026-10).
