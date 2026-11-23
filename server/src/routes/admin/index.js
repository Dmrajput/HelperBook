import { Router } from "express";
import {
  activity,
  adminCreate,
  adminStatus,
  admins,
  analyticsSection,
  attention,
  audit,
  couponCreate,
  couponPatch,
  coupons,
  couponsReport,
  employee,
  employeeLogin,
  employees,
  login,
  lead,
  leadPatch,
  leads,
  logout,
  me,
  payment,
  paymentManual,
  payments,
  paymentsReport,
  planPricing,
  planPricingPatch,
  refund,
  refresh,
  registrations,
  search,
  settings,
  settingsPatch,
  shop,
  shopNotes,
  shopStatus,
  shops,
  subscription,
  subscriptionAssignPlan,
  subscriptionCancelRenewal,
  subscriptionRecovery,
  subscriptions,
  summary,
  supportTicketsReport,
  ticket,
  ticketNote,
  ticketPatch,
  ticketReply,
  tickets,
  trends,
  user,
  userStatus,
  users,
} from "../../controllers/admin/admin.controller.js";
import { requireAdminAuth, requireAdminPermission, requireSuperAdmin } from "../../middleware/requireAdminAuth.js";

const router = Router();

router.post("/auth/login", login);
router.post("/auth/refresh", refresh);
router.post("/auth/logout", logout);

router.use(requireAdminAuth);
router.get("/auth/me", me);
router.get("/search", search);

router.get("/dashboard/summary", requireAdminPermission("dashboard.read"), summary);
router.get("/dashboard/trends", requireAdminPermission("dashboard.read"), trends);
router.get("/dashboard/recent-activity", requireAdminPermission("dashboard.read"), activity);
router.get("/dashboard/attention", requireAdminPermission("dashboard.read"), attention);

router.get("/users", requireAdminPermission("users.read"), users);
router.get("/users/:id", requireAdminPermission("users.read"), user);
router.patch("/users/:id/status", requireAdminPermission("users.suspend"), userStatus);

router.get("/shops", requireAdminPermission("shops.read"), shops);
router.get("/shops/:id", requireAdminPermission("shops.read"), shop);
router.patch("/shops/:id/status", requireAdminPermission("shops.suspend"), shopStatus);
router.patch("/shops/:id", requireAdminPermission("shops.update"), shopNotes);

router.get("/employees", requireAdminPermission("employees.read"), employees);
router.get("/employees/:id", requireAdminPermission("employees.read"), employee);
router.patch("/employees/:id/login-status", requireAdminPermission("employees.update"), employeeLogin);

router.get("/subscriptions", requireAdminPermission("subscriptions.read"), subscriptions);
router.get("/subscriptions/:id", requireAdminPermission("subscriptions.read"), subscription);
router.post("/subscriptions/:id/recovery", requireAdminPermission("subscriptions.update"), subscriptionRecovery);
router.post("/subscriptions/:id/cancel-renewal", requireAdminPermission("subscriptions.update"), subscriptionCancelRenewal);
router.post("/subscriptions/:id/assign-plan", requireAdminPermission("subscriptions.update"), subscriptionAssignPlan);
router.get("/plan-pricing", requireAdminPermission("subscriptions.read"), planPricing);
router.patch("/plan-pricing/:planId", requireAdminPermission("subscriptions.update"), planPricingPatch);

router.get("/payments", requireAdminPermission("payments.read"), payments);
router.get("/payments/:id", requireAdminPermission("payments.read"), payment);
router.post("/payments/manual", requireAdminPermission("payments.refund"), paymentManual);
router.post("/payments/:id/refunds", requireAdminPermission("payments.refund"), refund);

router.get("/reports/registrations", requireAdminPermission("reports.read"), registrations);
router.get("/reports/payments", requireAdminPermission("reports.read"), paymentsReport);
router.get("/reports/support", requireAdminPermission("reports.read"), supportTicketsReport);
router.get("/reports/coupons", requireAdminPermission("reports.read"), couponsReport);

router.get("/support/tickets", requireAdminPermission("support.read"), tickets);
router.get("/support/tickets/:id", requireAdminPermission("support.read"), ticket);
router.post("/support/tickets/:id/replies", requireAdminPermission("support.reply"), ticketReply);
router.post("/support/tickets/:id/internal-notes", requireAdminPermission("support.reply"), ticketNote);
router.patch("/support/tickets/:id", requireAdminPermission("support.reply"), ticketPatch);

router.get("/coupons", requireAdminPermission("coupons.read"), coupons);
router.post("/coupons", requireAdminPermission("coupons.create"), couponCreate);
router.patch("/coupons/:id", requireAdminPermission("coupons.update"), couponPatch);

router.get("/analytics/:section", requireAdminPermission("analytics.read"), analyticsSection);
router.get("/leads", requireAdminPermission("leads.read"), leads);
router.get("/leads/:id", requireAdminPermission("leads.read"), lead);
router.patch("/leads/:id", requireAdminPermission("leads.update"), leadPatch);
router.get("/audit-logs", requireAdminPermission("audit.read"), audit);
router.get("/settings", requireSuperAdmin, settings);
router.patch("/settings", requireSuperAdmin, settingsPatch);
router.get("/admins", requireSuperAdmin, admins);
router.post("/admins", requireSuperAdmin, adminCreate);
router.patch("/admins/:id/status", requireSuperAdmin, adminStatus);

export default router;
