import mongoose from "mongoose";
import { ADVANCE_NOTE_LIMIT, ADVANCE_STATUSES } from "../constants/advance.js";

const repaymentSettingsSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ["salary_deduction"], default: undefined },
    monthlyAmount: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const employeeAdvanceSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    originalAmount: { type: Number, required: true, min: 0.01 },
    remainingBalance: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: ADVANCE_STATUSES, default: "active", required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: "", trim: true, maxlength: ADVANCE_NOTE_LIMIT },
    repaymentSettings: { type: repaymentSettingsSchema, default: () => ({ monthlyAmount: 0 }) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    closedAt: { type: Date, default: null },
    requestId: { type: String, default: undefined, maxlength: 80 },
    currency: { type: String, enum: ["INR"], default: "INR", required: true },
  },
  { timestamps: true }
);

employeeAdvanceSchema.index({ shopId: 1, employeeId: 1, status: 1 });
employeeAdvanceSchema.index({ shopId: 1, employeeId: 1, date: 1, createdAt: 1 });
employeeAdvanceSchema.index(
  { shopId: 1, requestId: 1 },
  { unique: true, partialFilterExpression: { requestId: { $type: "string" } } }
);

const EmployeeAdvance = mongoose.model("EmployeeAdvance", employeeAdvanceSchema);

export default EmployeeAdvance;
