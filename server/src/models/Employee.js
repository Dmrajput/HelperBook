import mongoose from "mongoose";
import { EMPLOYEE_ROLES, EMPLOYEE_STATUSES, SALARY_TYPES } from "../constants/employee.js";

const salarySchema = new mongoose.Schema(
  {
    type: { type: String, enum: SALARY_TYPES, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ["INR"], required: true, default: "INR" },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, default: null, trim: true },
    role: { type: String, enum: EMPLOYEE_ROLES, required: true },
    customRole: { type: String, default: null, trim: true, maxlength: 80 },
    joiningDate: { type: Date, required: true },
    salary: { type: salarySchema, required: true },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: "active", required: true },
    deactivatedAt: { type: Date, default: null },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    loginEnabled: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    employeeAuthCreatedAt: { type: Date, default: null },
    notificationSettings: {
      pushEnabled: { type: Boolean, default: true },
      leaveUpdatesEnabled: { type: Boolean, default: true },
      salaryPaidEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

employeeSchema.index({ shopId: 1, status: 1 });
employeeSchema.index({ shopId: 1, name: 1 });
employeeSchema.index({ shopId: 1, role: 1 });
employeeSchema.index({ shopId: 1, phone: 1 });
employeeSchema.index({ shopId: 1, loginEnabled: 1 });
employeeSchema.index({ phone: 1, status: 1, loginEnabled: 1 });

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
