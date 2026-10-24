# HelperBook privacy policy

Effective date: 24 October 2026

This policy describes the HelperBook mobile app, the HelperBook API, and the HelperBook admin panel. It explains how personal and business information is collected, used, shared, and deleted.

## 1. Who provides the service

- Legal name: Divyarajsinh Mavendrasinh Padhiyar
- Trade name: HelperBook
- Contact email: helperbookofficial@gmail.com
- Address: Ahmedabad, Gujarat, India
- Grievance contact: Divyarajsinh Mavendrasinh Padhiyar, helperbookofficial@gmail.com, Ahmedabad, Gujarat, India

## 2. Who this policy covers

It covers shop owners who create a HelperBook account, employees whose shop enables login, and people who contact support. HelperBook is for small-business staff management. It is not directed at children under 13, and we do not knowingly collect personal information from children.

## 3. Information the app processes

HelperBook processes:

- Mobile numbers, password hashes, and one-time codes used only to set or reset a password. Codes and passwords are stored as hashes.
- Owner name, shop name, business type, address, contact details, working hours, and an optional shop logo.
- Employee name, phone number, role, joining date, status, and notes.
- Attendance, leave, and whether approved sick leave is treated as paid or unpaid.
- Salary amounts, bonuses, deductions, payment status, and salary receipts.
- Advance and repayment records.
- Subscription plan, trial state, Razorpay order and payment references, and coupon redemption records. Card or UPI credentials are entered on Razorpay's page and are not stored by HelperBook.
- Device id, device name, and platform stored with a login session. Push tokens and notification preferences.
- Support messages and account-deletion requests.
- IP address and request time in rate-limit records and server logs.
- Admin names, emails, and password hashes for the separate admin panel.

HelperBook does not include a third-party analytics or crash-reporting SDK in the mobile app.

## 4. Why this information is used

- To create and secure accounts.
- To show a shop only its own employees, attendance, leave, salary, advances, and reports.
- To calculate salary and advance balances from the records the shop enters. This is a bookkeeping aid, not tax, payroll, or legal advice.
- To send the shop's own notifications, such as leave updates and salary-paid notices. Push text for salary does not include the amount.
- To bill the HelperBook subscription the owner chooses.
- To answer support and deletion requests.
- To investigate abuse, fraud, and security incidents.

## 5. Who else processes it

HelperBook uses these processors only as needed to run the service:

- Render, to host the API and related web services.
- MongoDB Atlas, to store application data.
- Twilio, if SMS OTP is enabled, to send password-reset codes.
- Razorpay, to process subscription payments.
- Cloudinary, if enabled, to store shop logos.
- Expo push notifications, when a signed-in user allows notifications.
- Google Play, if the Android app is distributed there. Play's own data processing is described by Google.

The admin panel and mobile app do not receive database, JWT, Twilio, Razorpay secret, or Cloudinary secret values.

## 6. Storage and security

Data is stored in MongoDB. Secrets stay in the server environment. Mobile access and refresh tokens use Expo Secure Store. Connections to the production API use HTTPS. Production MongoDB uses TLS. Logs are redacted for connection strings, bearer tokens, and development OTP lines. Backups, if configured, are a separate copy and may not be deleted at the same moment as an account request.

## 7. Retention and deletion

Owners request deletion from More → Delete account. Employees request deletion from Profile → Delete account. Both create a support ticket with category `account_deletion`. Submitting the request does not immediately erase salary, advance, payment, or subscription records.

When a request is completed, we revoke that account's sessions and disable its login. Records needed for accounting, fraud prevention, disputes, or legal obligations may be kept for up to 7 years. Other shops' records are not deleted.

Public deletion instructions: https://helperbook.onrender.com/delete-account

## 8. Rights and contact

Write to helperbookofficial@gmail.com to request access, correction, or deletion of your personal information. We will respond within a reasonable time under applicable Indian law, including the Digital Personal Data Protection Act, 2023 where it applies. This policy does not promise that every copy, including backups, disappears immediately.

## 9. Changes

We may update this policy from time to time. The effective date at the top of this page will change when we do. Continued use of HelperBook after an update means you accept the revised policy.
