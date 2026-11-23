import test, { after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

const TEST_URI = "mongodb://127.0.0.1:27017/helperbook_marketing_lead_test";
process.env.JWT_ACCESS_SECRET ||= "marketing-test-access-secret-32-characters";
process.env.JWT_REFRESH_SECRET ||= "marketing-test-refresh-secret-32-characters";
process.env.OTP_HASH_SECRET ||= "marketing-test-otp-hash-secret-32-characters";
process.env.RAZORPAY_WEBHOOK_SECRET ||= "marketing-test-webhook-secret";

await mongoose.connect(TEST_URI);
if (mongoose.connection.name !== "helperbook_marketing_lead_test") {
  throw new Error(`Connected to ${mongoose.connection.name} instead of the isolated test database.`);
}

const { default: app } = await import("../src/app.js");
const { hashPassword } = await import("../src/services/admin/adminAuth.service.js");
const { default: AdminUser } = await import("../src/models/AdminUser.js");
const { default: MarketingLead } = await import("../src/models/MarketingLead.js");

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

const demoBody = {
  fullName: "Demo Visitor",
  companyName: "Sample Shop",
  email: "demo.visitor@example.com",
  phone: "+919876543210",
  teamSize: "6-20",
  preferredDate: "2026-12-01",
  preferredTimeWindow: "Morning",
  timezone: "Asia/Kolkata",
  message: "Want to see attendance and salary.",
  privacyAccepted: true,
  idempotencyKey: "demo-key-1",
};

test("public demo request is validated and stored", async () => {
  const invalid = await api("/public/demo-requests", {
    method: "POST",
    body: { ...demoBody, privacyAccepted: false },
  });
  assert.equal(invalid.status, 400);

  const created = await api("/public/demo-requests", { method: "POST", body: demoBody });
  assert.equal(created.status, 201, created.json.message);
  assert.ok(created.json.data.lead.referenceId);
  assert.match(created.json.message, /confirm a suitable time/i);

  const duplicate = await api("/public/demo-requests", { method: "POST", body: demoBody });
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.json.data.duplicate, true);

  const lead = await MarketingLead.findOne({ referenceId: created.json.data.lead.referenceId });
  assert.equal(lead.type, "demo");
  assert.equal(lead.status, "new");
  assert.ok(lead.privacyAcknowledgedAt);
});

test("public inquiry is stored and public cannot list leads", async () => {
  const created = await api("/public/inquiries", {
    method: "POST",
    body: {
      fullName: "Inquiry Visitor",
      email: "inquiry.visitor@example.com",
      inquiryCategory: "product_question",
      message: "How does leave approval work with attendance?",
      privacyAccepted: true,
      idempotencyKey: "inq-key-1",
    },
  });
  assert.equal(created.status, 201, created.json.message);

  assert.equal((await api("/admin/leads")).status, 401);
  assert.equal((await api(`/admin/leads/${created.json.data.lead.id}`)).status, 401);
  assert.equal((await api("/public/demo-requests")).status, 404);
});

test("admin lead permissions and updates are enforced", async () => {
  const password = "LeadTest!Pass1";
  const hash = await hashPassword(password);
  const reader = await AdminUser.create({
    email: "leads-reader@helperbook.test",
    name: "Reader",
    role: "read_only_admin",
    passwordHash: hash,
  });
  const support = await AdminUser.create({
    email: "leads-support@helperbook.test",
    name: "Support",
    role: "support_agent",
    passwordHash: hash,
  });
  const readerLogin = await api("/admin/auth/login", { method: "POST", body: { email: reader.email, password } });
  const supportLogin = await api("/admin/auth/login", { method: "POST", body: { email: support.email, password } });
  const readerToken = readerLogin.json.data.accessToken;
  const supportToken = supportLogin.json.data.accessToken;

  const list = await api("/admin/leads?type=demo", { token: readerToken });
  assert.equal(list.status, 200);
  assert.ok(list.json.data.total >= 1);

  const leadId = list.json.data.leads[0].id;
  const denied = await api(`/admin/leads/${leadId}`, {
    method: "PATCH",
    token: readerToken,
    body: { status: "contacted", reason: "Reader cannot update" },
  });
  assert.equal(denied.status, 403);

  const updated = await api(`/admin/leads/${leadId}`, {
    method: "PATCH",
    token: supportToken,
    body: { status: "contacted", note: "Called the shop owner.", reason: "Follow-up" },
  });
  assert.equal(updated.status, 200, updated.json.message);
  assert.equal(updated.json.data.lead.status, "contacted");
  assert.equal(updated.json.data.lead.internalNotes.length, 1);
});

test("public plans and platform endpoints respond", async () => {
  const plans = await api("/public/plans");
  assert.equal(plans.status, 200);
  assert.ok(Array.isArray(plans.json.data.plans));
  assert.ok(plans.json.data.plans.every((plan) => plan.id !== "free"));

  const platform = await api("/public/platform");
  assert.equal(platform.status, 200);
  assert.ok(platform.json.data.productName);
});

test("preferred date is stored as a request field only", async () => {
  const lead = await MarketingLead.findOne({ email: "demo.visitor@example.com" });
  assert.equal(lead.preferredDate, "2026-12-01");
  assert.equal(lead.status, "contacted");
  assert.notEqual(lead.status, "demo_scheduled");
});

after(async () => {
  server.close();
  if (mongoose.connection.name === "helperbook_marketing_lead_test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
