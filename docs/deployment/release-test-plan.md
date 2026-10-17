# Release test plan

Run this against a production candidate: HTTPS API, Twilio, Cloudinary, and live-or-sandbox payment keys that match that environment. Do not run destructive cases on a real shop.

Automated server tests:

```text
cd server
npm test
```

They use `mongodb://127.0.0.1:27017/helperbook_security_test` and refuse the `helperbook` database. They do not call Razorpay, Twilio, or a phone.

## Manual groups

Record Passed, Failed, Blocked, or Skipped. Skipped is not Passed.

1. Authentication. Owner register, login, wrong password, forgot-password code, expired code, reset, refresh, logout, logout-all. Employee login only when the shop enabled it. Employee cannot call owner salary edits. Admin roles stay inside the admin app.
2. Isolation. Two test shops. Owner A cannot open owner B's employee by changing the id. Employee A cannot open employee B.
3. Attendance and leave. Present, absent, half day, leave, bulk save, weekly off, overlapping leave, paid and unpaid sick leave in salary.
4. Salary and advances. Monthly and daily salary, bonus, deduction, advance, repayment, receipt, no double deduction.
5. Subscription. Free limit of 1 active employee. Paid limits. Trial expiry. Captured payment activates. Failed, cancelled, bad signature, wrong amount, and duplicate webhook do not. Use provider test mode only on a non-production project.
6. Reports and notifications. Date filters, PDF, Excel, push register and remove. Push text must not include a salary amount.
7. Android. Fresh install of the AAB from Play internal testing. Login, backgrounding, token expiry, no debug server button, API host is HTTPS, cleartext is off.
8. Account deletion. Owner and employee each receive a ticket number. A second tap returns the same open request. No other shop's data changes.

Device matrix: at least one physical Android phone. API 36 behavior is not proven until that phone or a Play pre-launch report is reviewed.
