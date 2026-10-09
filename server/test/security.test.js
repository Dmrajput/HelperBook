import test, { after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

const TEST_URI = "mongodb://127.0.0.1:27017/helperbook_security_test";
if (mongoose.connection.name === "helperbook" || !TEST_URI.endsWith("helperbook_security_test")) {
  throw new Error("Refusing to run security tests against a non-test database.");
}

process.env.JWT_ACCESS_SECRET ||= "security-test-access-secret-32-characters";
process.env.JWT_REFRESH_SECRET ||= "security-test-refresh-secret-32-characters";
process.env.OTP_HASH_SECRET ||= "security-test-otp-hash-secret-32-characters";
process.env.RAZORPAY_WEBHOOK_SECRET ||= "security-test-webhook-secret";

await mongoose.connect(TEST_URI);
if (mongoose.connection.name !== "helperbook_security_test") {
  throw new Error(`Connected to ${mongoose.connection.name} instead of the isolated test database.`);
}

const { default: app } = await import("../src/app.js");
const { adminHasPermission } = await import("../src/config/adminPermissions.js");
const { hashPassword } = await import("../src/services/admin/adminAuth.service.js");
const { webhookSignature } = await import("../src/services/razorpay.service.js");
const { quoteCoupon } = await import("../src/services/admin/coupon.service.js");
const {
  hashToken,
  signAccessToken,
  signAdminAccessToken,
  signEmployeeAccessToken,
  signRefreshToken,
  verifyAccessToken,
} = await import("../src/utils/tokens.js");
const { default: User } = await import("../src/models/User.js");
const { default: Session } = await import("../src/models/Session.js");
const { default: Employee } = await import("../src/models/Employee.js");
const { default: EmployeeSession } = await import("../src/models/EmployeeSession.js");
const { default: Subscription } = await import("../src/models/Subscription.js");
const { default: AdminUser } = await import("../src/models/AdminUser.js");
const { default: Coupon } = await import("../src/models/Coupon.js");

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;

function noneAlgorithmToken() {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({
    sub: new mongoose.Types.ObjectId().toString(),
    role: "owner",
    type: "access",
    sid: new mongoose.Types.ObjectId().toString(),
  })).toString("base64url");
  return `${header}.${body}.`;
}

async function api(path, { method = "GET", token, body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function ownerFixture(phone, name) {
  const user = await User.create({
    phoneNumber: phone,
    countryCode: "+91",
    fullName: name,
    role: "owner",
    isVerified: true,
    isActive: true,
  });
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = signRefreshToken(user._id, sessionId);
  await Session.create({
    _id: sessionId,
    userId: user._id,
    refreshTokenHash: hashToken(refreshToken),
    deviceId: `device-${phone}`,
    deviceName: "test",
    platform: "web",
    expiresAt: new Date(Date.now() + 7 * 86400000),
    lastUsedAt: new Date(),
  });
  return { user, refreshToken, accessToken: signAccessToken(user, sessionId) };
}

const shopBody = (name) => ({
  name,
  businessType: "Retail Store",
  owner: { fullName: name },
  address: { addressLine1: "1 Road", city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  workingSchedule: {
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    startTime: "09:00",
    endTime: "18:00",
  },
});

const employeeBody = (name, phone) => ({
  name,
  phone,
  role: "helper",
  joiningDate: "2026-10-01",
  salary: { type: "monthly", amount: 8000 },
});

test("permission helpers reject unrelated roles", () => {
  assert.equal(adminHasPermission({ role: "super_admin" }, "payments.refund"), true);
  assert.equal(adminHasPermission({ role: "read_only_admin" }, "payments.refund"), false);
  assert.equal(adminHasPermission({ role: "support_agent" }, "payments.refund"), false);
  assert.equal(adminHasPermission({ role: "support_agent" }, "subscriptions.update"), false);
  assert.equal(adminHasPermission({ role: "finance_admin" }, "users.suspend"), false);
});

test("unsigned and none-algorithm tokens are rejected", () => {
  assert.throws(() => verifyAccessToken(noneAlgorithmToken()));
  assert.throws(() => verifyAccessToken("not-a-token"));
  assert.throws(() => verifyAccessToken(""));
});

test("owner, employee, and admin identities stay isolated", async () => {
  const ownerA = await ownerFixture("9876501701", "Owner A");
  const ownerB = await ownerFixture("9876501702", "Owner B");
  const shopA = await api("/shops", { method: "POST", token: ownerA.accessToken, body: shopBody("Shop A Security") });
  const shopB = await api("/shops", { method: "POST", token: ownerB.accessToken, body: shopBody("Shop B Security") });
  assert.equal(shopA.status, 201, shopA.json.message);
  assert.equal(shopB.status, 201, shopB.json.message);

  await Subscription.updateMany({}, { status: "expired", isTrial: false, trialEndsAt: new Date("2020-01-01") });

  const created = await Promise.all([
    api("/employees", { method: "POST", token: ownerA.accessToken, body: { ...employeeBody("Worker One", "9876501711"), shopId: shopB.json.data.shop.id, isVerified: true } }),
    api("/employees", { method: "POST", token: ownerA.accessToken, body: employeeBody("Worker Two", "9876501712") }),
  ]);
  const successes = created.filter((result) => result.status === 201);
  const denied = created.filter((result) => result.status === 403);
  assert.equal(successes.length, 1);
  assert.equal(denied.length, 1);
  assert.equal(denied[0].json.data.code, "EMPLOYEE_LIMIT_REACHED");
  const employeeA = await Employee.findOne({ name: { $in: ["Worker One", "Worker Two"] } });
  assert.equal(String(employeeA.shopId), shopA.json.data.shop.id);
  employeeA.loginEnabled = true;
  await employeeA.save();

  const employeeBResponse = await api("/employees", { method: "POST", token: ownerB.accessToken, body: employeeBody("Worker B", "9876501721") });
  assert.equal(employeeBResponse.status, 201, employeeBResponse.json.message);
  const employeeBUser = { _id: employeeBResponse.json.data.employee.id };
  const hidden = await api(`/employees/${employeeBUser._id}`, { token: ownerA.accessToken });
  assert.equal(hidden.status, 404);
  const attendance = await api(`/attendance/employee/${employeeBUser._id}`, { token: ownerA.accessToken });
  assert.notEqual(attendance.status, 200);

  const employeeSessionId = new mongoose.Types.ObjectId();
  await EmployeeSession.create({
    _id: employeeSessionId,
    employeeId: employeeA._id,
    shopId: employeeA.shopId,
    refreshTokenHash: hashToken("employee-refresh-placeholder-token"),
    deviceId: "employee-device",
    expiresAt: new Date(Date.now() + 86400000),
  });
  const employeeToken = signEmployeeAccessToken(employeeA, employeeSessionId);
  assert.equal((await api("/employees", { token: employeeToken })).status, 401);
  assert.equal((await api("/admin/users", { token: employeeToken })).status, 401);
  assert.equal((await api("/admin/dashboard/summary", { token: ownerA.accessToken })).status, 401);
  assert.equal((await api(`/employee-portal/salary/${new mongoose.Types.ObjectId()}`, { token: employeeToken })).status, 404);

  const loggedOut = await api("/auth/logout", { method: "POST", token: ownerA.accessToken, body: { refreshToken: ownerA.refreshToken } });
  assert.equal(loggedOut.status, 200);
  assert.equal((await api("/auth/me", { token: ownerA.accessToken })).status, 401);
  assert.equal((await api("/auth/refresh", { method: "POST", body: { refreshToken: ownerA.refreshToken } })).status, 401);
});

test("admin roles cannot cross their permissions", async () => {
  const password = "Phase17!Security";
  const hash = await hashPassword(password);
  const reader = await AdminUser.create({ email: "phase17-read@helperbook.test", name: "Reader", role: "read_only_admin", passwordHash: hash });
  const support = await AdminUser.create({ email: "phase17-support@helperbook.test", name: "Support", role: "support_agent", passwordHash: hash });
  const readerLogin = await api("/admin/auth/login", { method: "POST", body: { email: reader.email, password } });
  const supportLogin = await api("/admin/auth/login", { method: "POST", body: { email: support.email, password } });
  assert.equal(readerLogin.status, 200);
  assert.equal(supportLogin.status, 200);
  const readerToken = readerLogin.json.data.accessToken;
  const supportToken = supportLogin.json.data.accessToken;
  assert.equal((await api("/admin/users/000000000000000000000000/status", { method: "PATCH", token: readerToken, body: { status: "suspended", reason: "Not permitted" } })).status, 403);
  assert.equal((await api("/admin/payments/000000000000000000000000/refunds", { method: "POST", token: supportToken, body: { reason: "Not permitted" } })).status, 403);
  assert.equal((await api("/admin/subscriptions", { token: supportToken })).status, 403);
  await AdminUser.updateOne({ _id: reader._id }, { isActive: false });
  assert.equal((await api("/admin/users", { token: readerToken })).status, 401);
  assert.equal((await api("/admin/auth/login", { method: "POST", body: { email: reader.email, password } })).status, 403);
});

test("webhook signatures and duplicate events are enforced", async () => {
  const payload = { event: "payment.captured", payload: { payment: { entity: { id: "pay_missing", order_id: "order_missing", amount: 1900, currency: "INR", status: "captured" } } } };
  const raw = JSON.stringify(payload);
  const bad = await fetch(`${base}/subscriptions/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-razorpay-signature": "bad-signature", "x-razorpay-event-id": "evt-security-1" },
    body: raw,
  });
  assert.equal(bad.status, 400);
  const goodHeaders = {
    "Content-Type": "application/json",
    "x-razorpay-signature": webhookSignature(Buffer.from(raw)),
    "x-razorpay-event-id": "evt-security-2",
  };
  const first = await fetch(`${base}/subscriptions/webhook`, { method: "POST", headers: goodHeaders, body: raw });
  const second = await fetch(`${base}/subscriptions/webhook`, { method: "POST", headers: goodHeaders, body: raw });
  const firstJson = await first.json();
  const secondJson = await second.json();
  assert.equal(first.status, 200);
  assert.equal(firstJson.duplicate, false);
  assert.equal(second.status, 200);
  assert.equal(secondJson.duplicate, true);
});

test("coupon math stays on the server and cannot make the amount negative", async () => {
  const admin = await AdminUser.create({
    email: "phase17-finance@helperbook.test",
    name: "Finance",
    role: "finance_admin",
    passwordHash: await hashPassword("Phase17!Security"),
  });
  await Coupon.create({
    code: "SEC10",
    normalizedCode: "SEC10",
    discountType: "percentage",
    discountValue: 10,
    applicablePlanIds: ["starter"],
    applicableBillingIntervals: ["monthly"],
    startsAt: new Date(Date.now() - 60000),
    expiresAt: new Date(Date.now() + 86400000),
    maxRedemptionsPerUser: 1,
    status: "active",
    createdByAdminId: admin._id,
  });
  const quoted = await quoteCoupon({ code: "sec10", planId: "starter", billingInterval: "monthly", userId: new mongoose.Types.ObjectId(), listPaise: 1900 });
  assert.equal(quoted.finalPaise, 1710);
  await assert.rejects(() => quoteCoupon({ code: "sec10", planId: "starter", billingInterval: "monthly", userId: new mongoose.Types.ObjectId(), listPaise: 100 }));
});

test("expired access tokens are rejected", async () => {
  const owner = await ownerFixture("9876501703", "Owner Expired");
  const jwt = (await import("jsonwebtoken")).default;
  const session = await Session.findOne({ userId: owner.user._id });
  const expired = jwt.sign(
    { sub: String(owner.user._id), role: "owner", sid: String(session._id), type: "access" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1ms", algorithm: "HS256" }
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal((await api("/auth/me", { token: expired })).status, 401);
});

after(async () => {
  server.close();
  if (mongoose.connection.name === "helperbook_security_test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
