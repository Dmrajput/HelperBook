# Security audit

This pass reviewed the existing HelperBook owner, employee, and admin applications. It did not add business modules. Findings below were confirmed in code or by the security test suite. Items that were inspected and found already protected are listed as informational.

## Critical

None confirmed.

## High

### Access tokens stayed valid after logout

- Where: `server/src/utils/tokens.js`, `server/src/middleware/authMiddleware.js`, `server/src/middleware/requireEmployee.js`, `server/src/middleware/requireAdminAuth.js`
- Risk: Owner, employee, and admin access tokens did not include a session id. Logout and session revocation blocked refresh, but the access token kept working until it expired.
- Fix: Access tokens now include `sid`. Each request checks that the matching session exists, belongs to that identity, and is not revoked or expired.
- Test: `server/test/security.test.js` logs an owner out and then rejects both the old access token and the old refresh token.

### Paid entitlement could start before capture

- Where: `server/src/services/subscription.service.js` `verifyPayment`
- Risk: Checkout verification accepted Razorpay status `authorized` as well as `captured`. The webhook path already required `captured`. An authorized payment can still fail to capture.
- Fix: Verification now requires `captured`, and the amount, currency, and order id must match the pending payment stored for that shop.
- Test: A live Razorpay capture was not executed because provider keys are not configured. The code path was inspected. Invalid webhook signatures are rejected by the test suite.

### Concurrent employee creation could pass the plan limit

- Where: `server/src/services/employee.service.js`, `server/src/services/subscription.service.js`
- Risk: The limit check counted active employees and then inserted. Two requests could both see a free slot.
- Fix: Creating or reactivating an employee claims `activeEmployeeSlots` with a conditional MongoDB update. The losing request receives `EMPLOYEE_LIMIT_REACHED`. Deactivation and deletion release a slot.
- Test: Two simultaneous creates on a free-plan shop produce one success and one 403.

## Medium

### Webhook events were recorded after processing

- Where: `server/src/services/subscriptionWebhook.service.js`
- Risk: Two deliveries of the same event could both pass the “already seen” check before either inserted the event id.
- Fix: The event id is inserted first with status `processing`. A duplicate key is treated as a duplicate delivery. If processing throws, the processing row is removed so a later delivery can retry. Payment activation still depends on the stored order amount and a unique Razorpay payment id.
- Test: An invalid signature is rejected. The same signed event id is processed once and reported as a duplicate the second time.

### Dependency advisories

- Server: `nodemon` / `braces` is a development-only file watcher issue. The suggested fix downgrades nodemon to 1.x. It is not used in production `npm start`. `exceljs` depends on an older `uuid`. The suggested fix downgrades exceljs to 3.x and would break report exports. Excel export is only reachable by an authenticated owner of that shop.
- Admin: `npm audit` reported no advisories.
- Mobile: Expo, Metro, and React Native advisories. The audit’s fix is Expo 44, which is not compatible with this app. These were not force-upgraded.
- Accepted risk: no critical advisories. High findings are either development-only or only “fixed” by breaking downgrades.

## Low

- Public health returns the Node environment name. It does not return database or secret details.
- Development CORS allows any browser origin. Production uses the `CLIENT_URL` allowlist. Cookies are not used for API auth.
- Admin bearer tokens stay in memory for the browser tab. A reload signs the admin out. HttpOnly cookies were not added, so CSRF protection for cookies was not required.

## Informational

- JWT verification allows only HS256. A token with `alg: none` is rejected.
- Owner, employee, and admin tokens use different `role` and `type` claims. Tests reject cross-use.
- Refresh tokens are stored as SHA-256 hashes and rotated. Reuse of a rotated owner refresh token revokes the session.
- Shop-scoped services load employees, attendance, salary, advances, and leave with the authenticated shop id.
- Mobile tokens use Expo Secure Store.
- Push copy for salary does not include the amount.
- Logo uploads check size, declared type, and file bytes.
- There is no admin impersonation feature.
- Rate limits for OTP, refresh, and admin login are stored in MongoDB, so they are shared by app instances that use the same database. Redis was not added.
- Local MongoDB in `.env.example` has no TLS or application user. That is a deployment prerequisite, not an application code defect by itself.

## Not claimed

This audit is not a certification that HelperBook is free of vulnerabilities.
