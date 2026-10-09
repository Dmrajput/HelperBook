import mongoose from "mongoose";
import { SALARY_TYPES } from "../constants/employee.js";
import {
  ADJUSTMENT_REASON_LIMIT,
  ATTENDANCE_DEDUCTION_MODES,
  SALARY_NOTE_LIMIT,
  SALARY_RECORD_STATUSES,
} from "../constants/salary.js";

const adjustmentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "", trim: true, maxlength: ADJUSTMENT_REASON_LIMIT },
  },
  { _id: false }
);

const attendanceSnapshotSchema = new mongoose.Schema(
  {
    presentDays: { type: Number, required: true, min: 0 },
    halfDays: { type: Number, required: true, min: 0 },
    leaveDays: { type: Number, required: true, min: 0 },
    paidLeaveDays: { type: Number, required: true, min: 0 },
    unpaidLeaveDays: { type: Number, required: true, min: 0 },
    approvedPaidDays: { type: Number, min: 0, default: 0 },
    approvedUnpaidDays: { type: Number, min: 0, default: 0 },
    absentDays: { type: Number, required: true, min: 0 },
    payableDays: { type: Number, required: true, min: 0 },
    beforeJoiningDays: { type: Number, required: true, min: 0, default: 0 },
    afterExitDays: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const calculationSchema = new mongoose.Schema(
  {
    baseSalary: { type: Number, required: true, min: 0 },
    attendanceDeduction: { type: Number, required: true, min: 0 },
    leaveDeduction: { type: Number, required: true, min: 0 },
    bonus: { type: Number, required: true, min: 0 },
    deduction: { type: Number, required: true, min: 0 },
    advanceDeduction: { type: Number, required: true, min: 0 },
    advanceDeductionManual: { type: Boolean, default: false },
    netSalary: { type: Number, required: true, min: 0 },
    warning: { type: String, default: "" },
  },
  { _id: false }
);

const salaryRecordSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    salaryType: { type: String, enum: SALARY_TYPES, required: true },
    salaryRate: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["INR"], required: true, default: "INR" },
    attendanceDeductionMode: {
      type: String,
      enum: ATTENDANCE_DEDUCTION_MODES,
      required: true,
    },
    workingDays: { type: Number, required: true, min: 0 },
    calendarDays: { type: Number, required: true, min: 1 },
    attendance: { type: attendanceSnapshotSchema, required: true },
    bonuses: { type: [adjustmentSchema], default: [] },
    deductions: { type: [adjustmentSchema], default: [] },
    calculation: { type: calculationSchema, required: true },
    status: { type: String, enum: SALARY_RECORD_STATUSES, default: "draft", required: true },
    notes: { type: String, default: "", trim: true, maxlength: SALARY_NOTE_LIMIT },
    calculatedAt: { type: Date, required: true },
    finalizedAt: { type: Date, default: null },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryPayment", default: null },
    paidAt: { type: Date, default: null },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    paymentDate: { type: Date, default: null },
    paymentMethod: { type: String, default: "" },
    paymentReference: { type: String, default: "" },
  },
  { timestamps: true }
);

salaryRecordSchema.index(
  { shopId: 1, employeeId: 1, year: 1, month: 1 },
  { unique: true }
);
salaryRecordSchema.index({ shopId: 1, year: 1, month: 1, status: 1 });
salaryRecordSchema.index({ shopId: 1, periodStart: 1, periodEnd: 1 });

const SalaryRecord = mongoose.model("SalaryRecord", salaryRecordSchema);

export default SalaryRecord;
