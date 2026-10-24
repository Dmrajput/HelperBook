# HelperBook — Code Audit & Optimization Report

**Date:** 2026-10-24  
**Scope:** Full repository (`mobile/` Expo app + `server/` Express API)

---

## 1. Overall code health

HelperBook is a coherent Expo 57 / RN 0.86 + Express 5 / Mongoose 9 HRMS with clear domain services, validators, and tenancy isolation. Business logic (especially payroll) is well-tested. Main gaps are **list virtualization**, **tab remount churn**, **duplicated shop-access helpers**, and **N+1 advance balance queries** on monthly salary lists—not architectural collapse.

**Stack (verified):**
- Mobile: Expo ~57.0.27, React 19.2.3, RN 0.86.3, React Navigation 7, Axios, Context (no Redux/Query)
- Server: Express 5.2.1, Mongoose 9.11.1, JWT, Helmet, Multer, ExcelJS, PDFKit

---

## 2. Duplicate code identified and consolidated

| Area | Action |
|------|--------|
| `requireShop` / ownership lookups across ~11 services | Shared `server/src/services/shopAccess.service.js` |
| Auth phone/password validation on login/register/reset screens | Shared `mobile/src/utils/authValidation.js` |
| Dead unused UI | Removed `HomePlaceholderScreen`, `EmptyState`, `LoadingView`, `RecentEmployees` |

**Not merged (intentionally):** owner vs employee auth OTP flows; different `AttendanceSummary` components; shop.service `requireShop` (different rules: inactive shop allowed for logo).

---

## 3. Performance bottlenecks found and fixed

| Issue | Fix |
|-------|-----|
| Custom tabs unmounted screens → remount + refetch | Keep-mounted tab panels (`MainTabs`, `EmployeeNavigator`) |
| Attendance day list: `ScrollView` + `.map` | Converted to `FlatList` with virtualization |
| Attendance draft reset on every refresh | Reset only when date / employee set changes |
| `useDailyAttendance` cleared data on every load | Keep prior data while refreshing; request-id cancel |
| Employee list loaded subscription **plans** every focus | `useSubscription({ includePlans: false })` |
| Monthly salaries N+1 `getAdvanceBalance` | Batch `getAdvanceBalancesByEmployeeIds` (one aggregate) |
| Auth middleware loaded full User/Session docs | `.select()` projections |
| Missing `Session.refreshTokenHash` index | Indexed (parity with employee/admin sessions) |

---

## 4. Memory / resource management

| Issue | Fix |
|-------|-----|
| Set-state after unmount on dashboard/attendance fetch | Request-id / cancel on blur |
| Tab remount retained no state; drafts lost | Keep-mounted tabs preserve attendance drafts |

**Remaining risks:** report PDF/Excel in-memory buffers; hourly jobs full-collection scans; multer memory uploads (documented, not changed this pass).

---

## 5. Security & reliability (reviewed)

**Strengths:** Helmet, body size limit, HS256 JWT, refresh hashing, mock OTP blocked in prod, webhook HMAC, tenant isolation tests.

**Open (not changed this pass — need product approval):**
- No global HTTP rate limit on expensive routes
- Razorpay secrets not asserted at boot in `assertEnv`
- Report services still paginate in memory after full `find`
- Admin list N+1 shop/subscription lookups

---

## 6. Files created / modified / removed

### Created
- `server/src/services/shopAccess.service.js`
- `server/src/services/advance.service.js` — added `getAdvanceBalancesByEmployeeIds`
- `mobile/src/utils/authValidation.js`
- `docs/audit/performance-audit-2026-10-24.md`

### Modified (high level)
- Server: `Session.js`, `authMiddleware.js`, `salary.service.js`, `employee.service.js`, `attendance.service.js`, `leave.service.js`, `dashboard.service.js`, `advance.service.js`, `salaryPayment.service.js`, `salaryReceipt.service.js`, `notification.service.js`, `validators/report.validator.js`
- Mobile: `MainTabs.js`, `EmployeeNavigator.js`, `AttendanceScreen.js`, `useAttendance.js`, `useDashboard.js`, `useSubscription.js`, `EmployeeListScreen.js`, auth screens (Login/Register/Forgot/Reset + employee variants)

### Removed
- `mobile/src/screens/HomePlaceholderScreen.js`
- `mobile/src/components/EmptyState.js`
- `mobile/src/components/LoadingView.js`
- `mobile/src/components/dashboard/RecentEmployees.js`

---

## 7. Dependencies

No package additions or removals. No dependency upgrades.

---

## 8. Tests executed

```text
cd server && npm test
# 27 pass, 0 fail (salaryCalculation + security)
# duration ~32s
```

Mobile: no automated test suite configured. Manual verification recommended: tab switch (state preserved), attendance FlatList scroll, login validation, employee add slot check without plans fetch.

---

## 9. Before / after (qualitative)

| Metric | Before | After |
|--------|--------|-------|
| Monthly salary advance balances | 1 aggregate **per employee** | **1 aggregate** for shop |
| Owner tab switch | Full remount + refetch | Keep mounted; drafts preserved |
| Attendance list | All cards in ScrollView | Virtualized FlatList |
| Employee list focus | subscription + plans | subscription only |
| Auth DB payload | Full User/Session docs | Projected fields |

Quantitative device profiling (startup ms, FPS) was not run in this environment.

---

## 10. Remaining issues (priority)

1. **High** — DB-level pagination for report services (salary/leave/advance/payment)
2. **High** — Batch `calculateAllSalaries` attendance/leave loads
3. **Med** — Global rate limits on `/reports/*`, `/salaries/calculate-all`
4. **Med** — Convert Salary / Leave / Notifications / ReportBrowser lists to FlatList
5. **Med** — Extract shared Auth layout for owner/employee login UIs
6. **Med** — Assert Razorpay env in production boot
7. **Low** — Split mega-screens (`EmployeeProfile`, `SalaryDetail`)
8. **Low** — Shared `takeSlot` rate-limit helper
9. **Low** — Expand integration tests for attendance/leave/pay flows

---

## 11. Recommended next steps

1. Profile monthly salary API with 50+ employees before/after (confirm aggregate win).
2. Migrate SalaryScreen + NotificationScreen to FlatList.
3. Add report DB pagination with export streaming.
4. Consider React Query only if focus-refetch churn remains after keep-mounted tabs.
5. Rebuild APK only if shipping these mobile UX/performance fixes to installed devices.
