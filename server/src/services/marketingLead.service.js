import crypto from "crypto";
import mongoose from "mongoose";
import MarketingLead, {
  DEMO_STATUSES,
  INQUIRY_STATUSES,
} from "../models/MarketingLead.js";
import PlatformSetting from "../models/PlatformSetting.js";
import AdminUser from "../models/AdminUser.js";
import { AppError } from "../utils/appError.js";
import { takeSlot } from "../utils/rateLimitSlot.js";
import { writeAudit } from "./admin/audit.service.js";
import { emailConfigured, leadAckEmail, leadInternalEmail, sendMail } from "./email/email.service.js";
import { publicPlanFromResolved, resolvePlans } from "./planPricing.service.js";
import { validateDemoRequest, validateInquiry } from "../validators/marketingLead.validator.js";

const HOUR_MS = 60 * 60 * 1000;

function hashIp(ip) {
  const value = String(ip || "").trim();
  if (!value) return "";
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 64);
}

function nextReferenceId(type) {
  const prefix = type === "demo" ? "HB-DEM" : "HB-INQ";
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${stamp}${rand}`.slice(0, 32);
}

function publicLeadView(lead) {
  return {
    id: String(lead._id),
    referenceId: lead.referenceId,
    type: lead.type,
    status: lead.status,
    createdAt: lead.createdAt,
  };
}

function adminLeadView(lead, { includeNotes = true } = {}) {
  return {
    id: String(lead._id),
    referenceId: lead.referenceId,
    type: lead.type,
    fullName: lead.fullName,
    companyName: lead.companyName || "",
    email: lead.email,
    phone: lead.phone || "",
    teamSize: lead.teamSize || "",
    inquiryCategory: lead.inquiryCategory || "",
    message: lead.message || "",
    preferredDate: lead.preferredDate || "",
    preferredTimeWindow: lead.preferredTimeWindow || "",
    timezone: lead.timezone || "Asia/Kolkata",
    status: lead.status,
    assignedAdminId: lead.assignedAdminId ? String(lead.assignedAdminId) : null,
    sourcePage: lead.sourcePage || "",
    privacyAcknowledgedAt: lead.privacyAcknowledgedAt,
    privacyPolicyVersion: lead.privacyPolicyVersion,
    marketingConsent: Boolean(lead.marketingConsent),
    internalNotes: includeNotes
      ? (lead.internalNotes || []).map((note) => ({
          adminId: note.adminId ? String(note.adminId) : null,
          body: note.body,
          createdAt: note.createdAt,
        }))
      : undefined,
    emailNotifyStatus: lead.emailNotifyStatus,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

async function enforceLeadLimits(ip, email) {
  const ipOk = await takeSlot(`lead-ip:${ip || "unknown"}`, 8, HOUR_MS);
  if (!ipOk) throw new AppError("Too many requests. Please try again later.", 429);
  const emailOk = await takeSlot(`lead-email:${email}`, 3, HOUR_MS);
  if (!emailOk) throw new AppError("Too many requests for this email. Please try again later.", 429);
}

async function notifyLead(lead) {
  if (!emailConfigured()) {
    lead.emailNotifyStatus = "skipped";
    await lead.save();
    return;
  }
  try {
    const settings = await PlatformSetting.findOne({ key: "platform" });
    const inbox =
      process.env.DEMO_NOTIFICATION_INBOX ||
      settings?.demoInboxEmail ||
      settings?.supportEmail ||
      "";
    if (inbox) {
      await sendMail(leadInternalEmail(lead, inbox));
    }
    await sendMail(leadAckEmail(lead));
    lead.emailNotifyStatus = "sent";
    await lead.save();
  } catch {
    lead.emailNotifyStatus = "failed";
    await lead.save();
  }
}

async function createLead(parsed, meta = {}) {
  await enforceLeadLimits(meta.ip, parsed.email);

  if (parsed.idempotencyKey) {
    const existing = await MarketingLead.findOne({ idempotencyKey: parsed.idempotencyKey });
    if (existing) {
      return { lead: publicLeadView(existing), duplicate: true };
    }
  }

  const recent = await MarketingLead.findOne({
    type: parsed.type,
    email: parsed.email,
    createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
  }).sort({ createdAt: -1 });
  if (recent && recent.message === (parsed.message || "") && recent.companyName === (parsed.companyName || "")) {
    return { lead: publicLeadView(recent), duplicate: true };
  }

  const lead = await MarketingLead.create({
    ...parsed,
    referenceId: nextReferenceId(parsed.type),
    status: "new",
    privacyAcknowledgedAt: new Date(),
    ipHash: hashIp(meta.ip),
    userAgent: String(meta.userAgent || "").slice(0, 300),
    emailNotifyStatus: "queued",
  });

  await notifyLead(lead);
  return { lead: publicLeadView(lead), duplicate: false };
}

export async function submitDemoRequest(body, meta = {}) {
  const parsed = validateDemoRequest(body);
  return createLead(parsed, meta);
}

export async function submitInquiry(body, meta = {}) {
  const parsed = validateInquiry(body);
  return createLead(parsed, meta);
}

export async function getPublicPlatform() {
  const setting = await PlatformSetting.findOne({ key: "platform" });
  return {
    productName: setting?.displayName || "HelperBook",
    legalCompanyName: setting?.legalCompanyName || "",
    companyDescription: setting?.companyDescription || "",
    supportEmail: setting?.supportEmail || "",
    supportPhone: setting?.supportPhone || "",
    supportHours: setting?.supportHours || "",
    address: setting?.address || "",
    whatsappNumber: setting?.whatsappNumber || "",
    websiteUrl: setting?.websiteUrl || "",
    appDownloadUrl: setting?.appDownloadUrl || "",
    loginUrl: setting?.loginUrl || "",
    privacyPolicyVersion: setting?.privacyPolicyVersion || "2026-10-24",
    reportingTimezone: setting?.reportingTimezone || "Asia/Kolkata",
    maintenanceBanner: setting?.maintenanceBanner || "",
  };
}

export async function getPublicPlans() {
  const plans = await resolvePlans();
  return {
    currency: "INR",
    timezone: "Asia/Kolkata",
    plans: plans
      .filter((plan) => plan.id !== "free")
      .map((plan) => publicPlanFromResolved(plan)),
    note: "Prices are current published plan amounts in INR. Taxes may apply.",
  };
}

function pageParams(query) {
  const page = Math.max(1, Number(query?.page) || 1);
  let limit = Number(query?.limit) || 20;
  if (!Number.isInteger(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  return { page, limit, skip: (page - 1) * limit };
}

export async function listLeads(query = {}) {
  const { page, limit, skip } = pageParams(query);
  const filter = {};
  if (query.type === "demo" || query.type === "inquiry") filter.type = query.type;
  if (query.status) filter.status = String(query.status).trim().slice(0, 40);
  if (query.search) {
    const term = String(query.search).trim().slice(0, 80);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { fullName: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { companyName: { $regex: escaped, $options: "i" } },
      { referenceId: { $regex: escaped, $options: "i" } },
    ];
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
    if (query.endDate) filter.createdAt.$lt = new Date(`${query.endDate}T23:59:59.999Z`);
  }
  const [rows, total] = await Promise.all([
    MarketingLead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    MarketingLead.countDocuments(filter),
  ]);
  return {
    leads: rows.map((row) => adminLeadView(row, { includeNotes: false })),
    page,
    limit,
    total,
  };
}

export async function getLead(id) {
  const lead = await MarketingLead.findById(id);
  if (!lead) throw new AppError("Lead was not found.", 404);
  let assignedAdmin = null;
  if (lead.assignedAdminId) {
    const admin = await AdminUser.findById(lead.assignedAdminId).select("name email");
    if (admin) assignedAdmin = { id: String(admin._id), name: admin.name, email: admin.email };
  }
  return { lead: adminLeadView(lead), assignedAdmin };
}

export async function updateLead(admin, id, body, meta = {}) {
  const lead = await MarketingLead.findById(id);
  if (!lead) throw new AppError("Lead was not found.", 404);
  const before = { status: lead.status, assignedAdminId: lead.assignedAdminId };
  const allowed = lead.type === "demo" ? DEMO_STATUSES : INQUIRY_STATUSES;
  if (body.status) {
    if (!allowed.includes(body.status)) throw new AppError("Choose a valid status.", 400);
    lead.status = body.status;
  }
  if (body.assignedAdminId === null || body.assignedAdminId === "") {
    lead.assignedAdminId = null;
  } else if (body.assignedAdminId) {
    if (!mongoose.isValidObjectId(body.assignedAdminId)) {
      throw new AppError("Choose a valid admin.", 400);
    }
    const assignee = await AdminUser.findById(body.assignedAdminId);
    if (!assignee) throw new AppError("Admin was not found.", 404);
    lead.assignedAdminId = assignee._id;
  }
  if (typeof body.note === "string" && body.note.trim()) {
    lead.internalNotes.push({
      adminId: admin._id,
      body: body.note.trim().slice(0, 4000),
    });
  }
  await lead.save();
  await writeAudit(admin, {
    action: "lead.update",
    resourceType: "marketing_lead",
    resourceId: lead._id,
    reason: typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "",
    beforeSummary: before,
    afterSummary: { status: lead.status, assignedAdminId: lead.assignedAdminId },
    requestId: meta.requestId || "",
    ipAddress: meta.ipAddress || "",
  });
  return { lead: adminLeadView(lead) };
}
