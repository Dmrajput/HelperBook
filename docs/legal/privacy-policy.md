# HelperBook privacy policy

Status: draft. This page is not in force until the owner replaces every bracketed placeholder, chooses an effective date, and publishes it on a public HTTPS address.

This policy describes the HelperBook mobile app, the HelperBook API, and the HelperBook admin panel as implemented in this repository. It is not a legal opinion.

## 1. Who provides the service

- Legal name: [Divyarajsinh Mavendrasinh Padhiyar]
- Trade name: HelperBook
- Contact email: [helperbookofficial@gmail.com]
- Address: [Ahemdabad]


## 2. Who this policy covers

It covers shop owners who create a HelperBook account, employees whose shop enables login, and people who contact support. HelperBook is for small-business staff management. It is not directed at children.

## 3. Information the app processes

The current code processes:

- Mobile numbers, password hashes, and one-time codes used only to set or reset a password. Codes and passwords are stored as hashes. The development mock code printer is rejected when `NODE_ENV=production`.
- Owner name, shop name, business type, address, contact details, working hours, and an optional shop logo.
- Employee name, phone number, role, joining date, status, and notes.
- Attendance, leave, and whether approved sick leave is treated as paid or unpaid.
- Salary amounts, bonuses, deductions, payment status, and salary receipts.
- Advance and repayment records.
- Subscription plan, trial state, Razorpay order and payment references, and coupon redemption records. Card or UPI credentials are entered on Razorpay's page, not stored by HelperBook.
- Device id, device name, and platform stored with a login session. Push tokens and notification preferences.
- Support messages and account-deletion requests.
- IP address and request time in rate-limit records and server logs.
- Admin names, emails, and password hashes for the separate admin panel.

HelperBook does not include a third-party analytics or crash-reporting SDK in the mobile app. Do not add one to a Data safety form unless a later release actually includes it.

## 4. Why this information is used

- To create and secure accounts.
- To show a shop only its own employees, attendance, leave, salary, advances, and reports.
- To calculate salary and advance balances from the records the shop enters. This is a bookkeeping aid, not tax, payroll, or legal advice.
- To send the shop's own notifications, such as leave updates and salary-paid notices. Push text for salary does not include the amount.
- To bill the HelperBook subscription the owner chooses.
- To answer support and deletion requests.
- To investigate abuse, fraud, and security incidents.

## 5. Who else processes it

Only providers that the deployment actually enables should be named on the published page:

- The host that runs the API. Not selected in this repository yet. The recommended host is documented in `docs/deployment/production-architecture.md`.
- MongoDB host for the `helperbook` database. Not provisioned yet.
- Twilio, if `OTP_PROVIDER=twilio`, to send password-reset codes.
- Razorpay, if live keys are configured, to take subscription payments.
- Cloudinary, if `IMAGE_PROVIDER=cloudinary`, to store shop logos.
- Expo push notifications, when a signed-in user allows notifications.
- Google Play, if the Android app is distributed there. Play's own data processing is described by Google.

The admin panel and mobile app do not receive database, JWT, Twilio, Razorpay secret, or Cloudinary secret values.

## 6. Storage and security

Data is stored in MongoDB. Secrets stay in the server environment. Mobile access and refresh tokens use Expo Secure Store. Connections to the production API must use HTTPS. Production MongoDB must use TLS. Logs are redacted for connection strings, bearer tokens, and development OTP lines. Backups, if configured, are a separate copy and are not deleted at the same moment as an account request.

## 7. Retention and deletion

Owners request deletion from More → Delete account. Employees request deletion from Profile → Delete account. Both create a support ticket with category `account_deletion`. Submitting the request does not immediately erase salary, advance, payment, or subscription records.

When a request is completed, the operator should revoke that account's sessions and disable its login. Records needed for accounting, fraud prevention, disputes, or the law can be kept for [RETENTION PERIOD — owner decision]. Other shops' records are not deleted.

Public instructions are served at `/delete-account` on the API host once that host is deployed. They are not on a public domain yet.

## 8. Rights and contact

Write to [SUPPORT EMAIL] to request access, correction, or deletion. The owner must describe how Indian law requests are handled before publication. This draft does not promise that every copy, including backups, disappears immediately.

## 9. Changes

The published page should show an effective date. This draft has no effective date.
