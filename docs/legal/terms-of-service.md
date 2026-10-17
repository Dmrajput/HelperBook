# HelperBook terms of service

Status: draft for the owner to review with a lawyer. Bracketed items are commercial or legal decisions. Do not publish this text as if those decisions have been made.

## 1. The service

HelperBook is an online-only app for a shop to keep employee details, attendance, leave, salary calculations, advances, receipts, and reports. It is not a substitute for an accountant, payroll service, or lawyer. Calculations follow the records and settings the shop enters.

## 2. Who may use it

Shop owners create an account with an Indian mobile number and a password. Employees can sign in only after the shop enables login for them. The owner is responsible for having a proper basis to store employee information.

Accounts must use accurate shop and owner details. The owner keeps the password private and must not share the account.

## 3. Plans in the current code

Configured in `server/src/config/subscription.config.js`, unless environment variables override the monthly amounts:

- Free: 1 active employee, ₹0.
- Starter: up to 2 active employees, ₹19 per month.
- Business: up to 5 active employees, ₹49 per month.
- Pro: up to 15 active employees, ₹149 per month.
- Trial: 7 days on the Pro limits when a trial is started. Yearly prices are not configured.

The server chooses the price. The phone cannot set the amount. A plan change that would leave too many active employees is blocked until the owner deactivates enough people. Existing employee records are not deleted by a downgrade.

## 4. Payment

Paid plans currently open Razorpay inside the app. The API activates a plan only after it verifies a captured payment for the stored order, amount, and currency. This repository does not implement Google Play Billing.

Before a Play release, the owner must confirm Google Play's current payments policy. For a digital subscription distributed on Play, Razorpay alone is not assumed to be allowed. India's user-choice billing program, if used, still requires enrollment, offering Play billing as a choice, transaction reporting, and the applicable service fee. See `docs/deployment/google-play-compliance-checklist.md`.

Refunds: [REFUND RULE — owner decision, subject to applicable law and the payment provider]. No refund promise is made by this draft.

## 5. Availability

HelperBook needs a network connection. There is no offline copy of shop data on the phone. The owner does not guarantee uptime in this draft: [UPTIME COMMITMENT — leave unset unless the owner agrees one].

## 6. Acceptable use

Do not misuse the service, attempt to access another shop's data, submit false payment information, or attack the API. The operator may suspend an account that is inactive, abusive, or required to be suspended by law. Suspension reasons already exist on the user record.

## 7. Data

The shop owns the business records it enters. HelperBook processes them to provide the service, as described in the privacy policy. Export is available through the report screens that the app already implements. Deletion follows `docs/legal/account-deletion.md`.

## 8. Intellectual property

The HelperBook name, app, and code are owned by [OWNER LEGAL NAME]. Shop logos and records stay with the shop, subject to the rights needed to host and display them.

## 9. Liability and disputes

[LIMITATION OF LIABILITY — lawyer review]
[GOVERNING LAW AND COURTS — owner decision, do not assume a city]

## 10. Contact

[SUPPORT EMAIL]
[OWNER ADDRESS]

Effective date: not set.
