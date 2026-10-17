# Release test results

Date: 9 October 2026. These are local results. They are not a production or device release test.

## Automated

Command: `npm test` in `server/`.

Database: `mongodb://127.0.0.1:27017/helperbook_security_test`. The suite refuses `helperbook` and drops only the test database at the end.

Result: 8 passed, 0 failed, 0 skipped. Duration about 7.6 seconds.

Covered:

- Admin permission helpers and rejected unsigned tokens.
- Owner, employee, and admin token isolation, including a cross-shop employee id.
- Admin role denials.
- Webhook invalid signature and duplicate event id.
- Coupon math that cannot make the amount negative.
- Expired access token.
- Owner register, rejection of `POST /api/auth/verify-otp`, wrong password, correct password, and a repeated account-deletion request returning the same ticket number.
- `GET /api/health` and `GET /api/ready` returned 200 on that test server.

Not covered by this command: Twilio delivery, Cloudinary upload, a live or test Razorpay capture, PDF or Excel on a device, push delivery, employee password reset, or any Android install.

## Local HTTP

On the development API at `http://127.0.0.1:5000` while `NODE_ENV` was development:

- `GET /api/health` returned 200 and included `environment` because this was not production.
- `GET /api/ready` returned 200.
- `GET /privacy`, `GET /terms`, and `GET /delete-account` returned 200.

## Not run

| Group | Status | Why |
| --- | --- | --- |
| Physical Android install | Blocked | No AAB was built |
| Production HTTPS login | Blocked | No public API |
| Employee password reset SMS | Blocked | Twilio is not configured |
| Subscription payment | Blocked | Razorpay keys are absent and Play billing is not implemented |
| Two-shop UI pass | Skipped | Not exercised by hand in this phase. Isolation is covered only by the API test above |
| Play internal testing | Not started | No Play Console upload |
