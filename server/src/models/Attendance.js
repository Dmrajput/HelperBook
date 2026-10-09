import mongoose from "mongoose";
import { ATTENDANCE_NOTE_LIMIT, ATTENDANCE_STATUSES } from "../constants/attendance.js";

const attendanceSchema = new mongoose.Schema(
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
    date: { type: Date, required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
    notes: { type: String, default: "", trim: true, maxlength: ATTENDANCE_NOTE_LIMIT },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ shopId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ shopId: 1, date: -1 });
attendanceSchema.index({ shopId: 1, employeeId: 1, date: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
