import mongoose from "mongoose";

const CATEGORIES = [
  "login",
  "shop_setup",
  "employees",
  "attendance",
  "salary",
  "advances",
  "leave",
  "subscription",
  "payment",
  "bug",
  "feature",
  "other",
];
const STATUSES = ["open", "in_progress", "waiting_for_customer", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const messageSchema = new mongoose.Schema(
  {
    authorType: { type: String, enum: ["customer", "admin"], required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const noteSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, trim: true },
    requesterType: { type: String, enum: ["owner", "employee"], required: true },
    requesterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    requesterEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", default: null },
    category: { type: String, enum: CATEGORIES, required: true },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    priority: { type: String, enum: PRIORITIES, default: "normal" },
    status: { type: String, enum: STATUSES, default: "open" },
    assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
    messages: { type: [messageSchema], default: [] },
    internalNotes: { type: [noteSchema], default: [] },
    firstResponseAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

supportTicketSchema.index({ ticketNumber: 1 }, { unique: true });
supportTicketSchema.index({ status: 1, updatedAt: -1 });
supportTicketSchema.index({ assignedAdminId: 1, status: 1, updatedAt: -1 });
supportTicketSchema.index({ shopId: 1, createdAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
export { CATEGORIES, STATUSES, PRIORITIES };
