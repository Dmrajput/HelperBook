import { sendSuccess } from "../../utils/apiResponse.js";
import {
  adminProfile,
  loginAdmin,
  logoutAdmin,
  refreshAdmin,
} from "../../services/admin/adminAuth.service.js";
import {
  analytics,
  couponReport,
  createAdmin,
  createCoupon,
  dashboardSummary,
  dashboardTrends,
  getEmployee,
  getPayment,
  getSettings,
  getShop,
  getSubscription,
  getTicket,
  getUser,
  listAdmins,
  listAudit,
  listCoupons,
  listEmployees,
  listPayments,
  listShops,
  listSubscriptions,
  listTickets,
  listUsers,
  noteTicket,
  paymentReport,
  recentActivity,
  recoverSubscription,
  refundPayment,
  registrationReport,
  replyTicket,
  searchAdmin,
  setAdminActive,
  setEmployeeLogin,
  setShopStatus,
  setUserStatus,
  supportReport,
  updateCoupon,
  updateSettings,
  updateTicket,
} from "../../services/admin/adminPlatform.service.js";

function ip(req) {
  return String(req.ip || "").replace("::ffff:", "");
}

export async function login(req, res) {
  const data = await loginAdmin({ email: req.body?.email, password: req.body?.password, ip: ip(req) });
  sendSuccess(res, "Signed in.", data);
}

export async function refresh(req, res) {
  const data = await refreshAdmin(req.body?.refreshToken);
  sendSuccess(res, "Session refreshed.", data);
}

export async function logout(req, res) {
  await logoutAdmin(req.body?.refreshToken);
  sendSuccess(res, "Signed out.", null);
}

export async function me(req, res) {
  sendSuccess(res, "Profile fetched.", { admin: adminProfile(req.admin) });
}

export async function summary(req, res) {
  sendSuccess(res, "Dashboard fetched.", await dashboardSummary(req.query));
}
export async function trends(req, res) {
  sendSuccess(res, "Trends fetched.", await dashboardTrends(req.query));
}
export async function activity(req, res) {
  sendSuccess(res, "Activity fetched.", await recentActivity());
}
export async function users(req, res) {
  sendSuccess(res, "Users fetched.", await listUsers(req.query));
}
export async function user(req, res) {
  sendSuccess(res, "User fetched.", await getUser(req.params.id));
}
export async function userStatus(req, res) {
  sendSuccess(res, "User updated.", await setUserStatus(req.admin, req.params.id, req.body));
}
export async function shops(req, res) {
  sendSuccess(res, "Shops fetched.", await listShops(req.query));
}
export async function shop(req, res) {
  sendSuccess(res, "Shop fetched.", await getShop(req.params.id));
}
export async function shopStatus(req, res) {
  sendSuccess(res, "Shop updated.", await setShopStatus(req.admin, req.params.id, req.body));
}
export async function employees(req, res) {
  sendSuccess(res, "Employees fetched.", await listEmployees(req.query));
}
export async function employee(req, res) {
  sendSuccess(res, "Employee fetched.", await getEmployee(req.params.id));
}
export async function employeeLogin(req, res) {
  sendSuccess(res, "Employee login updated.", await setEmployeeLogin(req.admin, req.params.id, req.body));
}
export async function subscriptions(req, res) {
  sendSuccess(res, "Subscriptions fetched.", await listSubscriptions(req.query));
}
export async function subscription(req, res) {
  sendSuccess(res, "Subscription fetched.", await getSubscription(req.params.id));
}
export async function subscriptionRecovery(req, res) {
  sendSuccess(res, "Subscription updated.", await recoverSubscription(req.admin, req.params.id, req.body));
}
export async function payments(req, res) {
  sendSuccess(res, "Payments fetched.", await listPayments(req.query));
}
export async function payment(req, res) {
  sendSuccess(res, "Payment fetched.", await getPayment(req.params.id));
}
export async function refund(req, res) {
  sendSuccess(res, "Refund recorded.", await refundPayment(req.admin, req.params.id, req.body));
}
export async function registrations(req, res) {
  const data = await registrationReport(req.query);
  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.send(`metric,count\nowners,${data.owners}\nshops,${data.shops}\nemployees,${data.employees}\n`);
    return;
  }
  sendSuccess(res, "Report fetched.", data);
}
export async function paymentsReport(req, res) {
  sendSuccess(res, "Report fetched.", await paymentReport(req.query));
}
export async function supportTicketsReport(req, res) {
  sendSuccess(res, "Report fetched.", await supportReport(req.query));
}
export async function couponsReport(req, res) {
  sendSuccess(res, "Report fetched.", await couponReport());
}
export async function tickets(req, res) {
  sendSuccess(res, "Tickets fetched.", await listTickets(req.query));
}
export async function ticket(req, res) {
  sendSuccess(res, "Ticket fetched.", await getTicket(req.params.id));
}
export async function ticketReply(req, res) {
  sendSuccess(res, "Reply sent.", await replyTicket(req.admin, req.params.id, req.body));
}
export async function ticketNote(req, res) {
  sendSuccess(res, "Note added.", await noteTicket(req.admin, req.params.id, req.body));
}
export async function ticketPatch(req, res) {
  sendSuccess(res, "Ticket updated.", await updateTicket(req.admin, req.params.id, req.body));
}
export async function coupons(req, res) {
  sendSuccess(res, "Coupons fetched.", await listCoupons());
}
export async function couponCreate(req, res) {
  sendSuccess(res, "Coupon created.", await createCoupon(req.admin, req.body), 201);
}
export async function couponPatch(req, res) {
  sendSuccess(res, "Coupon updated.", await updateCoupon(req.admin, req.params.id, req.body));
}
export async function analyticsSection(req, res) {
  sendSuccess(res, "Analytics fetched.", await analytics(req.params.section, req.query));
}
export async function search(req, res) {
  sendSuccess(res, "Search complete.", await searchAdmin(req.query, req.admin));
}
export async function audit(req, res) {
  sendSuccess(res, "Audit log fetched.", await listAudit(req.query));
}
export async function settings(req, res) {
  sendSuccess(res, "Settings fetched.", await getSettings());
}
export async function settingsPatch(req, res) {
  sendSuccess(res, "Settings updated.", await updateSettings(req.admin, req.body));
}
export async function admins(req, res) {
  sendSuccess(res, "Admins fetched.", await listAdmins());
}
export async function adminCreate(req, res) {
  sendSuccess(res, "Admin created.", await createAdmin(req.admin, req.body), 201);
}
export async function adminStatus(req, res) {
  sendSuccess(res, "Admin updated.", await setAdminActive(req.admin, req.params.id, req.body?.isActive));
}
