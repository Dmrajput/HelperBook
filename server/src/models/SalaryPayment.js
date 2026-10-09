import mongoose from "mongoose";
import {
  SALARY_PAYMENT_METHODS,
  SALARY_PAYMENT_NOTE_LIMIT,
  SALARY_PAYMENT_RECORD_STATUSES,
  SALARY_PAYMENT_REFERENCE_LIMIT,
  SALARY_REVERSAL_REASON_MAX,
} from "../constants/salary.js";

const salaryPaymentSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    salaryId: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryRecord", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: SALARY_PAYMENT_METHODS, required: true },
    paymentReference: { type: String, default: "", trim: true, maxlength: SALARY_PAYMENT_REFERENCE_LIMIT },
    paymentDate: { type: Date, required: true },
    status: { type: String, enum: SALARY_PAYMENT_RECORD_STATUSES, required: true, default: "paid" },
    notes: { type: String, default: "", trim: true, maxlength: SALARY_PAYMENT_NOTE_LIMIT },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reversedAt: { type: Date, default: null },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reversalReason: { type: String, default: "", trim: true, maxlength: SALARY_REVERSAL_REASON_MAX },
    requestId: { type: String, default: undefined, maxlength: 80 },
  },
  { timestamps: true }
);

salaryPaymentSchema.index({ shopId: 1, paymentDate: -1, createdAt: -1 });
salaryPaymentSchema.index({ shopId: 1, employeeId: 1, paymentDate: -1 });
salaryPaymentSchema.index(
  { shopId: 1, salaryId: 1 },
  { unique: true, partialFilterExpression: { status: "paid" } }
);
salaryPaymentSchema.index(
  { shopId: 1, requestId: 1 },
  { unique: true, partialFilterExpression: { requestId: { $type: "string" } } }
);

const SalaryPayment = mongoose.model("SalaryPayment", salaryPaymentSchema);

export default SalaryPayment;
