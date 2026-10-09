import mongoose from "mongoose";
import { LEAVE_NOTE_LIMIT, LEAVE_STATUSES, LEAVE_TYPES, SALARY_TREATMENTS } from "../constants/leave.js";

const leaveSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    salaryTreatment: { type: String, enum: SALARY_TREATMENTS, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 1 },
    reason: { type: String, default: "", trim: true, maxlength: LEAVE_NOTE_LIMIT },
    status: { type: String, enum: LEAVE_STATUSES, required: true, default: "pending" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "", trim: true, maxlength: LEAVE_NOTE_LIMIT },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelledAt: { type: Date, default: null },
    notes: { type: String, default: "", trim: true, maxlength: LEAVE_NOTE_LIMIT },
  },
  { timestamps: true }
);

leaveSchema.index({ shopId: 1, employeeId: 1, startDate: -1 });
leaveSchema.index({ shopId: 1, status: 1, startDate: 1 });
leaveSchema.index({ shopId: 1, employeeId: 1, startDate: 1, endDate: 1 });

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
