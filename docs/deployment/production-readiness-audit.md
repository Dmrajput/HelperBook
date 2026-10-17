# Production readiness audit

Date: 9 October 2026. Evidence is from the repository and from commands run in this workspace. No production host was contacted.

## Stack found

- Mobile: Expo SDK `~57.0.27`, React Native `0.86.3`, React `19.2.3`, JavaScript. Package `com.helperbook.app`, version `1.0.0`, Android `versionCode` 1. No `android/` directory and no previous Play upload key in the repo.
- API: Express 5, Mongoose 9, Node in CI is 20. Start script `node src/server.js`. Listens on `0.0.0.0:$PORT`.
- Admin: Vite React app. `VITE_API_BASE_URL` defaults to `http://localhost:5000/api` in `admin/src/api/adminApi.js` when the variable is missing.
- Auth now: phone plus password for owners and employees. One-time code only for password reset. Admin uses its own password. This differs from older README text that said owner login was OTP-only. That root README sentence was corrected.
- Payments: Razorpay order, checkout WebView, captured-only verification, raw-body webhook. No Google Play Billing.
- CI: `.github/workflows/security.yml` runs server tests and the admin build. It does not deploy.

## Findings

### Critical

1. No production deployment exists.
   - Evidence: no Render service, Atlas cluster, domain, or DNS records in the repo. Local API uses `mongodb://localhost:27017/helperbook`.
   - Risk: the app cannot be offered to Play users.
   - Action: follow `production-architecture.md` after the owner creates the accounts.
   - Verify: `GET /api/health` and `GET /api/ready` on the HTTPS host.

2. Paid plans use Razorpay inside a WebView and Play Billing is absent.
   - Evidence: `mobile/src/components/subscription/RazorpayCheckout.js`. Play's payments policy requires Play billing for digital subscriptions unless an enrolled alternative-billing program applies. India's program is user-choice billing alongside Play billing, not Razorpay by itself. Checked against [Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738) and [India billing changes](https://support.google.com/googleplay/android-developer/answer/13306652) on 9 October 2026.
   - Risk: Play can reject the app.
   - Action: owner decides, before submission, either to enroll and add Play billing as a choice, or to remove in-app purchase until that work is done. Do not hide checkout in a browser to avoid the policy.
   - Verify: Play Console billing declaration matches the binary.

3. No Android App Bundle has been built or signed.
   - Evidence: `mobile/eas.json` production profile exists. `eas build` was not run. No keystore is in git, which is correct. No EAS account was used.
   - Risk: there is no artifact to upload.
   - Action: owner installs EAS CLI, logs in, sets `EXPO_PUBLIC_API_URL` to the HTTPS API, and runs the production build. Back up the upload key outside git.
   - Verify: Play Console accepts the AAB and the package is `com.helperbook.app`.

### High

4. Production secrets for SMS, files, and payments are not configured.
   - Evidence: `server/.env.example` leaves Twilio, Cloudinary, and Razorpay blank. `assertEnv` rejects mock OTP and local images in production.
   - Risk: reset codes, logos, or paid plans fail closed, or someone deploys test keys.
   - Action: set live provider credentials only on the host. Production startup now rejects `rzp_test_` key ids.
   - Verify: a production boot log without printing the secret values, then one test-mode check in a non-production project.

5. Backup restore has not been proven.
   - Evidence: `docs/security/backup-and-recovery.md` already says `mongodump` was not installed and no restore test was done. This phase did not run one.
   - Risk: a database loss may be unrecoverable.
   - Action: install Database Tools on a machine that is allowed to read production, dump to storage outside git, restore into a different database name.
   - Verify: the checks listed in that document, with the date and duration recorded.

6. Privacy policy, terms, and the deletion page are drafts and are not on a public domain.
   - Evidence: `docs/legal/`. The API can serve them at `/privacy`, `/terms`, and `/delete-account`, but only after deploy.
   - Risk: Play requires a public privacy-policy URL.
   - Action: owner fills the placeholders and publishes HTTPS URLs.
   - Verify: open the URLs in a private browser with no login.

### Medium

7. Account deletion is a tracked request, not an immediate erase.
   - Evidence: `POST /api/account/deletion-request` and `POST /api/employee-auth/deletion-request` create an `account_deletion` support ticket. Financial rows are kept on purpose.
   - Risk: Play may expect the request to be completed, not only stored.
   - Action: an admin must process the ticket, revoke sessions, and disable login, then record what was retained.
   - Verify: submit a request on a test account and confirm the ticket number.

8. Dependency advisories from Phase 17 remain accepted.
   - Evidence: `docs/security/security-audit.md`. Expo was not downgraded. `exceljs` was not downgraded.
   - Risk: known library issues remain.
   - Action: upgrade only with a compatibility test. Do not apply the audit's suggested breaking downgrades.

9. Admin API base falls back to localhost.
   - Evidence: `admin/src/api/adminApi.js`.
   - Risk: a production admin build without `VITE_API_BASE_URL` calls the builder's localhost.
   - Action: set the HTTPS API URL at admin build time.
   - Verify: the built admin bundle does not contain `localhost:5000`.

### Low

10. Development health responses include the environment name. Production responses no longer do.
    - Evidence: `server/src/controllers/health.controller.js`.
    - Verify: production `GET /api/health` has no `environment` field.

11. `app.json` still allows cleartext so local HTTP development keeps working. `mobile/app.config.js` turns cleartext on only when `EXPO_PUBLIC_API_URL` starts with `http://`. Release code throws if the URL is not HTTPS.
    - Evidence: `mobile/src/config/env.js`, `mobile/app.config.js`.
    - Verify: inspect the merged manifest of the production AAB. Not done, because no AAB exists.

### Informational

- Phase 17 session-bound tokens, captured-only payments, shop isolation, and helmet, CORS allowlist, and body limits are still in the code. This pass did not re-run a full penetration test.
- Expo SDK 57's published table lists Android `compileSdkVersion` 36 and `targetSdkVersion` 36 ([Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)). That was not confirmed inside a built artifact.
- Google Play, as of 31 August 2026, requires new apps and updates to target API 36 ([Android target API guidance](https://developer.android.com/google/play/requirements/target-sdk)).
- No analytics SDK was found. Do not declare analytics collection unless one is added.
