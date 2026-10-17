# Google Play compliance checklist

Status: preparation only. No Play Console app, upload, or review exists in this workspace.

## Identity

- App name: HelperBook
- Package: `com.helperbook.app` (keep this once it is registered)
- Version name: `1.0.0`
- Version code: `1`
- Target API: Expo SDK 57 publishes target 36. The built manifest was not inspected.
- Signing: no keystore in git. Create or reuse the Play upload key in EAS. Do not generate a second key to bypass a mismatch.

## Billing blocker

HelperBook sells digital employee-slot subscriptions inside the Android app through Razorpay's checkout script in a WebView. Prices in code are monthly only: Free ₹0 (1 employee), Starter ₹19 (2), Business ₹49 (5), Pro ₹149 (15), trial 7 days on Pro.

Play's payments policy requires Google Play billing for this kind of subscription unless a specific program applies. For India, Google documents user-choice billing: Play billing remains available and an alternative such as Razorpay may be offered after enrollment, reporting, and the reduced service fee. Razorpay alone, or a browser hop that hides checkout, is not treated here as compliant.

This is a launch blocker until the owner completes one of these:

- Enroll in the India user-choice program and add Play Billing as a real choice, with server-side verification.
- Or remove in-app paid checkout from the Play build until that work exists.

Salary payments a shop makes to employees are not HelperBook subscription fees. They are records in the app, not a Play purchase.

## Data safety inventory

Mark a row collected only if that build and its SDKs actually send it. This table matches the current code, not a future SDK.

| Data | Collected | Shared | Required | Encrypted in transit | Retention | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Phone number | Yes | SMS provider when Twilio is on | Yes for account | HTTPS to API | Until deletion review | User and Employee models |
| Password | Hash only | No | Yes | HTTPS | Until changed or account closed | bcrypt hash, `select: false` |
| One-time reset code | Hash only | SMS provider | Only for reset | HTTPS and SMS | Until expiry | OTP collections |
| Name, shop, address | Yes | Logo host if Cloudinary is on | Shop setup | HTTPS | Account lifetime plus retention | Shop model |
| Employee work records | Yes | No third party by default | Entered by owner | HTTPS | Same | Employee, attendance, leave |
| Salary, advance, receipts | Yes | No | Feature data | HTTPS | Financial retention | Salary and advance models |
| Subscription payment refs | Yes | Razorpay | Only if the owner pays | HTTPS | Payment records | Subscription payment model |
| Device id, name, platform | Yes | No | Login session | HTTPS | Session lifetime | Session models |
| Push token | Yes | Expo push service | Optional | HTTPS | Until logout or unregister | PushToken model |
| Photos for logo | Yes if the owner picks one | Cloudinary in production | Optional | HTTPS | Until replaced or deletion review | expo-image-picker |
| Diagnostics | Server logs and IP rate limits | Hosting provider | Operational | HTTPS | Host log retention | morgan, OtpRateLimit |
| Crash analytics | No SDK found | No | n/a | n/a | n/a | No Sentry or Firebase in mobile package.json |
| Ads | No | No | n/a | n/a | n/a | No ad SDK |
| Location, contacts, microphone | Not used by app code | No | n/a | n/a | n/a | No matching plugins |

Precise Play Console categories still have to be clicked by the owner to match this inventory. Health data is not collected. Attendance is a work record, not a health feature. Sick leave is a leave type, not a medical record.

## Permissions to declare

From `mobile/app.json` plugins:

- Camera and photos: shop logo only, requested by the image picker when used.
- Notifications: optional push.
- Internet: required because the app is online-only.

Do not add location, contacts, or microphone. Confirm the merged manifest after the AAB build. `usesCleartextTraffic` must be false on that production manifest.

## App content forms

- Privacy policy URL: not published. Draft: `docs/legal/privacy-policy.md`.
- Account deletion: in-app request plus `/delete-account`. Not on a public domain yet.
- Ads: No.
- Target audience: adults running a business. Not for children.
- Category: Business.
- Financial features: the app records salary and also sells a digital subscription. Answer the Play form from the real screens. Do not call it a bank or tax product.
- Content rating: complete the questionnaire in Play Console. Do not invent a rating.
- Support email: [SUPPORT EMAIL], not chosen.

## Reviewer access

Do not use a real customer's shop. After production SMS works, create a dedicated reviewer owner:

1. Register with a phone the owner controls.
2. Set the password through the app.
3. Add one sample employee and turn on that employee's login.
4. Put the phone, password, and steps only in Play Console app access. Do not put them in this file or the store listing.

Until Twilio and the production API exist, reviewer login cannot be verified.

## Closed testing

Google requires many personal developer accounts created after 13 November 2023 to keep at least 12 testers opted in for 14 days before production access. Confirm the rule on this owner's Play account. Do not invent testers or a start date. Closed testing has not started.

## Checklist

- [ ] Play app created with package `com.helperbook.app`
- [ ] Billing path decided and implemented
- [ ] Privacy URL public
- [ ] Deletion URL public and a test request completed
- [ ] Data safety matches the AAB
- [ ] AAB uploaded to internal testing
- [ ] Closed test completed if the account requires it
- [ ] Production access approved if required
