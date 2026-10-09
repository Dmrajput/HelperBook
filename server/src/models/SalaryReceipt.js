import mongoose from "mongoose";

const salaryReceiptSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    salaryId: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryRecord", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryPayment", required: true },
    receiptNumber: { type: String, required: true, trim: true },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

salaryReceiptSchema.index({ shopId: 1, receiptNumber: 1 }, { unique: true });
salaryReceiptSchema.index({ shopId: 1, paymentId: 1 }, { unique: true });
salaryReceiptSchema.index({ shopId: 1, salaryId: 1 });
salaryReceiptSchema.index({ shopId: 1, employeeId: 1, createdAt: -1 });

const SalaryReceipt = mongoose.model("SalaryReceipt", salaryReceiptSchema);

export default SalaryReceipt;
