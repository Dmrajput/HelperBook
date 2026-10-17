import PlatformSetting from "../models/PlatformSetting.js";
import Shop from "../models/Shop.js";
import SupportTicket from "../models/SupportTicket.js";

const OPEN_STATUSES = ["open", "in_progress", "waiting_for_customer"];
const DESCRIPTION = [
  "Account deletion was requested from the signed-in app.",
  "Do not hard-delete salary, advance, payment, or subscription records until the retention review is finished.",
  "When the request is completed, revoke the sessions and disable login for this account only.",
].join(" ");

async function nextTicketNumber() {
  const setting = await PlatformSetting.findOneAndUpdate(
    { key: "platform" },
    { $inc: { ticketSequence: 1 }, $setOnInsert: { key: "platform" } },
    { upsert: true, returnDocument: "after" }
  );
  return `HB-SUP-${String(setting.ticketSequence).padStart(6, "0")}`;
}

function publicRequest(ticket, alreadyRequested) {
  return {
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    alreadyRequested,
  };
}

export async function requestOwnerAccountDeletion(user) {
  const existing = await SupportTicket.findOne({
    requesterType: "owner",
    requesterUserId: user._id,
    category: "account_deletion",
    status: { $in: OPEN_STATUSES },
  }).sort({ createdAt: -1 });
  if (existing) return publicRequest(existing, true);

  const shop = await Shop.findOne({ ownerId: user._id }).select("_id");
  const ticket = await SupportTicket.create({
    ticketNumber: await nextTicketNumber(),
    requesterType: "owner",
    requesterUserId: user._id,
    shopId: shop?._id || null,
    category: "account_deletion",
    subject: "Account deletion request",
    description: DESCRIPTION,
    priority: "high",
    messages: [{ authorType: "customer", authorId: user._id, body: DESCRIPTION }],
  });
  return publicRequest(ticket, false);
}

export async function requestEmployeeAccountDeletion(employee) {
  const existing = await SupportTicket.findOne({
    requesterType: "employee",
    requesterEmployeeId: employee._id,
    category: "account_deletion",
    status: { $in: OPEN_STATUSES },
  }).sort({ createdAt: -1 });
  if (existing) return publicRequest(existing, true);

  const ticket = await SupportTicket.create({
    ticketNumber: await nextTicketNumber(),
    requesterType: "employee",
    requesterEmployeeId: employee._id,
    shopId: employee.shopId,
    category: "account_deletion",
    subject: "Employee account deletion request",
    description: DESCRIPTION,
    priority: "high",
    messages: [{ authorType: "customer", authorId: employee._id, body: DESCRIPTION }],
  });
  return publicRequest(ticket, false);
}
