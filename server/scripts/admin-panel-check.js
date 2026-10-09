import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const { default: app } = await import("../src/app.js");
const { default: connectDatabase } = await import("../src/config/database.js");
const { hashPassword } = await import("../src/services/admin/adminAuth.service.js");
const { quoteCoupon } = await import("../src/services/admin/coupon.service.js");
const { getLastDevOtp } = await import("../src/services/otp/providers/mock.provider.js");
const { signEmployeeAccessToken } = await import("../src/utils/tokens.js");
const { default: AdminModel } = await import("../src/models/AdminUser.js");
const { default: SubscriptionPayment } = await import("../src/models/SubscriptionPayment.js");

await connectDatabase();

const emails = [
  "phase16-super@helperbook.test",
  "phase16-support@helperbook.test",
  "phase16-finance@helperbook.test",
  "phase16-read@helperbook.test",
];
await AdminModel.deleteMany({ email: { $in: emails } });
const password = "Phase16!Admin";
const hash = await hashPassword(password);
const [superAdmin, support, finance, reader] = await Promise.all([
  AdminModel.create({ email: emails[0], name: "Super", role: "super_admin", passwordHash: hash }),
  AdminModel.create({ email: emails[1], name: "Support", role: "support_agent", passwordHash: hash }),
  AdminModel.create({ email: emails[2], name: "Finance", role: "finance_admin", passwordHash: hash }),
  AdminModel.create({ email: emails[3], name: "Reader", role: "read_only_admin", passwordHash: hash }),
]);

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;
const failures = [];
const ownerPhone = "9860000001";

function check(name, ok, detail) {
  if (!ok) {
    failures.push(detail ? `${name} (${detail})` : name);
    console.error("FAIL", name, detail || "");
  } else {
    console.log("ok", name);
  }
}

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

try {
  async function adminLogin(email) {
    const result = await api("/admin/auth/login", { method: "POST", body: { email, password } });
    if (result.status !== 200) throw new Error(`${email} ${result.status} ${result.json.message}`);
    return result.json.data.accessToken;
  }

  const superToken = await adminLogin(superAdmin.email);
  const supportToken = await adminLogin(support.email);
  const financeToken = await adminLogin(finance.email);
  const readToken = await adminLogin(reader.email);
  check("bad password rejected", (await api("/admin/auth/login", { method: "POST", body: { email: superAdmin.email, password: "wrong-password" } })).status === 401);

  const ownerPassword = "OwnerPass1";
  const ownerDevice = { deviceId: "admin-check", deviceName: "test", platform: "web" };
  let ownerAuth = await api("/auth/register", {
    method: "POST",
    body: { phoneNumber: ownerPhone, countryCode: "+91", fullName: "Phase Owner", password: ownerPassword, ...ownerDevice },
  });
  if (ownerAuth.status === 409) {
    const resetRequest = await api("/auth/forgot-password", { method: "POST", body: { phoneNumber: ownerPhone, countryCode: "+91" } });
    check("owner reset code", resetRequest.status === 200, resetRequest.json.message);
    ownerAuth = await api("/auth/reset-password", {
      method: "POST",
      body: { phoneNumber: ownerPhone, countryCode: "+91", otp: getLastDevOtp(`+91${ownerPhone}`), password: ownerPassword, ...ownerDevice },
    });
  }
  const ownerToken = ownerAuth.json?.data?.accessToken;
  check("owner signed in", ownerAuth.status === 200 || ownerAuth.status === 201, ownerAuth.json.message);
  check("owner token cannot open admin", (await api("/admin/dashboard/summary", { token: ownerToken })).status === 401);

  const employeeToken = signEmployeeAccessToken({ _id: new mongoose.Types.ObjectId(), shopId: new mongoose.Types.ObjectId() });
  check("employee token cannot open admin", (await api("/admin/users", { token: employeeToken })).status === 401);

  const summary = await api("/admin/dashboard/summary?range=last_30_days", { token: superToken });
  check("dashboard uses live counts", summary.status === 200 && Number.isFinite(summary.json.data.owners), summary.json.message);
  check("read only can view users", (await api("/admin/users", { token: readToken })).status === 200);
  check("read only cannot suspend", (await api("/admin/users/000000000000000000000000/status", { method: "PATCH", token: readToken, body: { status: "suspended", reason: "Not allowed here" } })).status === 403);
  check("support cannot refund", (await api("/admin/payments/000000000000000000000000/refunds", { method: "POST", token: supportToken, body: { reason: "Should fail permission" } })).status === 403);
  check("support cannot view subscriptions", (await api("/admin/subscriptions", { token: supportToken })).status === 403);
  check("finance can view payments", (await api("/admin/payments?range=last_30_days", { token: financeToken })).status === 200);

  const shop = await api("/shops", {
    method: "POST",
    token: ownerToken,
    body: {
      name: "Admin Check Store",
      businessType: "Retail Store",
      owner: { fullName: "Admin Owner" },
      address: { addressLine1: "1 Road", city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
      workingSchedule: {
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        startTime: "09:00",
        endTime: "18:00",
      },
    },
  });
  check("shop created", shop.status === 201, shop.json.message);

  const users = await api("/admin/users?search=Admin", { token: superToken });
  const ownerId = users.json.data?.users?.find((user) => user.name.includes("Admin"))?.id;
  check("admin finds owner", Boolean(ownerId));

  const ticket = await api("/support/tickets", {
    method: "POST",
    token: ownerToken,
    body: { category: "subscription", subject: "Need plan help", description: "Please review the shop subscription." },
  });
  check("owner creates ticket", ticket.status === 201, ticket.json.message);
  const ticketId = ticket.json.data?.ticket?.id;
  check("support replies", (await api(`/admin/support/tickets/${ticketId}/replies`, { method: "POST", token: supportToken, body: { body: "We are looking into this." } })).status === 200);
  const note = await api(`/admin/support/tickets/${ticketId}/internal-notes`, { method: "POST", token: supportToken, body: { body: "Internal only." } });
  check("internal note stored", note.status === 200 && note.json.data?.ticket?.internalNotes?.length === 1, note.json.message);

  const suspended = await api(`/admin/users/${ownerId}/status`, { method: "PATCH", token: superToken, body: { status: "suspended", reason: "Security review" } });
  check("super admin suspends owner", suspended.status === 200, suspended.json.message);
  const blocked = await api("/dashboard", { token: ownerToken });
  check("suspended owner session rejected", blocked.status === 403, String(blocked.status));
  const reactivated = await api(`/admin/users/${ownerId}/status`, { method: "PATCH", token: superToken, body: { status: "active", reason: "Review complete" } });
  check("super admin reactivates owner", reactivated.status === 200, reactivated.json.message);
  check("support cannot reactivate", (await api(`/admin/users/${ownerId}/status`, { method: "PATCH", token: supportToken, body: { status: "active", reason: "Support cannot reactivate" } })).status === 403);

  const shops = await api("/admin/shops?search=Admin%20Check", { token: superToken });
  const shopId = shops.json.data?.shops?.[0]?.id;
  const shopSuspended = await api(`/admin/shops/${shopId}/status`, { method: "PATCH", token: superToken, body: { status: "suspended", reason: "Billing review" } });
  check("shop suspended separately", shopSuspended.status === 200 && shopSuspended.json.data?.accessSuspended === true, shopSuspended.json.message);
  const shopBlocked = await api("/employees", { token: ownerToken });
  check("suspended shop blocks business routes", shopBlocked.status === 403, String(shopBlocked.status));
  const shopProfile = await api("/shops/me", { token: ownerToken });
  check("suspended shop profile remains readable", shopProfile.status === 200, shopProfile.json.message);
  const subscription = await mongoose.connection.collection("subscriptions").findOne({ shopId: new mongoose.Types.ObjectId(shopId) });
  check("subscription unchanged by shop suspension", Boolean(subscription) && subscription.status !== "cancelled");

  const payment = await SubscriptionPayment.create({
    userId: ownerId,
    shopId,
    subscriptionId: subscription._id,
    planId: "starter",
    billingInterval: "monthly",
    amount: 1900,
    currency: "INR",
    status: "paid",
    razorpayOrderId: `order_phase16_${Date.now()}`,
    paidAt: new Date(),
  });
  const refund = await api(`/admin/payments/${payment._id}/refunds`, { method: "POST", token: financeToken, body: { reason: "Customer asked for a review" } });
  const stored = await SubscriptionPayment.findById(payment._id);
  check("refund without provider stays requested", refund.status === 200 && refund.json.data?.refundStatus === "requested" && stored.status === "paid" && stored.refundStatus === "requested", refund.json.message);

  const coupon = await api("/admin/coupons", {
    method: "POST",
    token: financeToken,
    body: {
      code: "start10",
      discountType: "percentage",
      discountValue: 10,
      applicablePlanIds: ["starter"],
      applicableBillingIntervals: ["monthly"],
      startsAt: new Date(Date.now() - 60000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      maxRedemptionsPerUser: 1,
    },
  });
  check("finance creates coupon", coupon.status === 201, coupon.json.message);
  const quoted = await quoteCoupon({ code: "start10", planId: "starter", billingInterval: "monthly", userId: ownerId, listPaise: 1900 });
  check("coupon discount calculated on server", quoted.finalPaise === 1710);
  let invalidBlocked = false;
  try {
    await quoteCoupon({ code: "missing", planId: "starter", billingInterval: "monthly", userId: ownerId, listPaise: 1900 });
  } catch {
    invalidBlocked = true;
  }
  check("invalid coupon rejected", invalidBlocked);

  const audit = await api("/admin/audit-logs", { token: superToken });
  check("audit log records suspension", (audit.json.data?.logs || []).some((log) => log.action === "user.suspend"));
  await AdminModel.updateOne({ _id: reader._id }, { isActive: false });
  check("disabled admin cannot sign in", (await api("/admin/auth/login", { method: "POST", body: { email: reader.email, password } })).status === 403);

  if (failures.length) {
    console.error("FAILED", failures);
    process.exitCode = 1;
  } else {
    console.log("ALL ADMIN CHECKS PASSED");
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  const user = await mongoose.connection.collection("users").findOne({ phoneNumber: ownerPhone });
  const adminIds = [superAdmin._id, support._id, finance._id, reader._id];
  if (user) {
    const shopsToRemove = await mongoose.connection.collection("shops").find({ ownerId: user._id }).toArray();
    const shopIds = shopsToRemove.map((item) => item._id);
    await mongoose.connection.collection("shops").deleteMany({ ownerId: user._id });
    await mongoose.connection.collection("subscriptions").deleteMany({ shopId: { $in: shopIds } });
    await mongoose.connection.collection("subscriptionhistories").deleteMany({ shopId: { $in: shopIds } });
    await mongoose.connection.collection("subscriptionpayments").deleteMany({ userId: user._id });
    await mongoose.connection.collection("supporttickets").deleteMany({ requesterUserId: user._id });
    await mongoose.connection.collection("sessions").deleteMany({ userId: user._id });
    await mongoose.connection.collection("users").deleteOne({ _id: user._id });
    await mongoose.connection.collection("otpverifications").deleteMany({ phoneNumber: `+91${ownerPhone}` });
  }
  await mongoose.connection.collection("coupons").deleteMany({ normalizedCode: "START10" });
  await mongoose.connection.collection("adminauditlogs").deleteMany({ adminId: { $in: adminIds } });
  await mongoose.connection.collection("adminsessions").deleteMany({ adminId: { $in: adminIds } });
  await AdminModel.deleteMany({ _id: { $in: adminIds } });
  server.close();
  await mongoose.disconnect();
}
