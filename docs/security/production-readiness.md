# Production readiness

## Run the checks

```text
cd server
npm test
```

The suite uses `mongodb://127.0.0.1:27017/helperbook_security_test` and drops that database at the end. It refuses to continue if it is connected to `helperbook`.

GitHub Actions workflow `.github/workflows/security.yml` runs the same server tests against a MongoDB service and builds the admin app. It does not deploy.

## Required environment

Set these only on the server:

- `MONGODB_URI` for a TLS-protected `helperbook` database and a least-privilege user
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_HASH_SECRET`
- `OTP_PROVIDER=twilio` plus Twilio credentials. `mock` is rejected when `NODE_ENV=production`
- `IMAGE_PROVIDER=cloudinary` plus Cloudinary credentials. `local` is rejected in production
- `CLIENT_URL` listing the admin and any allowed web origins
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` only for the one-time admin command

The admin build may set `VITE_API_BASE_URL`. It must not receive any secret above.

OTP and admin login limits already read `OTP_MAX_REQUESTS_PER_HOUR`, `OTP_MAX_IP_REQUESTS_PER_HOUR`, `OTP_VERIFY_MAX_PER_WINDOW`, and `REFRESH_MAX_PER_WINDOW`. Defaults are 5 OTP requests per phone per hour, 40 per IP per hour, 40 verify attempts per window, and 60 refresh attempts per window. Admin login allows 8 attempts per email and 20 per IP in 15 minutes.

## Still required before production

- Install `mongodump`, take a backup outside the repository, and restore it into a separate database. See `backup-and-recovery.md`.
- Put the API behind HTTPS. The process listens on `0.0.0.0` and `PORT`.
- Confirm Razorpay checkout and webhook with the live keys. This suite does not call Razorpay.
- Accept the documented dependency advisories or upgrade Expo and ExcelJS only after a compatibility test. Do not apply the audit’s suggested downgrades blindly.

Existing owner and employee sign-ins will need a new login after this release because access tokens now require a session id.
