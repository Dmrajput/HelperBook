import mongoose from "mongoose";
import {
  ADVANCE_CATEGORIES,
  ADVANCE_NOTE_LIMIT,
  ADVANCE_PAYMENT_METHODS,
  ADVANCE_SOURCES,
  ADVANCE_TRANSACTION_TYPES,
} from "../constants/advance.js";

const advanceTransactionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    advanceId: { type: mongoose.Schema.Types.ObjectId, ref: "EmployeeAdvance", required: true },
    type: { type: String, enum: ADVANCE_TRANSACTION_TYPES, required: true },
    category: { type: String, enum: ADVANCE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    signedAmount: { type: Number, required: true },
    date: { type: Date, required: true },
    source: { type: String, enum: ADVANCE_SOURCES, required: true },
    salaryRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryRecord", default: null },
    notes: { type: String, default: "", trim: true, maxlength: ADVANCE_NOTE_LIMIT },
    paymentMethod: { type: String, enum: [...ADVANCE_PAYMENT_METHODS, ""], default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reversed: { type: Boolean, default: false },
    reversedTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "AdvanceTransaction", default: null },
    requestId: { type: String, default: undefined, maxlength: 80 },
  },
  { timestamps: true }
);

advanceTransactionSchema.index({ shopId: 1, employeeId: 1, date: -1, createdAt: -1 });
advanceTransactionSchema.index({ shopId: 1, advanceId: 1, date: -1, createdAt: -1 });
advanceTransactionSchema.index({ shopId: 1, salaryRecordId: 1, type: 1 });
advanceTransactionSchema.index(
  { shopId: 1, salaryRecordId: 1, advanceId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "salary_deduction", reversed: false },
  }
);
advanceTransactionSchema.index(
  { shopId: 1, requestId: 1 },
  { unique: true, partialFilterExpression: { requestId: { $type: "string" } } }
);

const AdvanceTransaction = mongoose.model("AdvanceTransaction", advanceTransactionSchema);

export default AdvanceTransaction;
