# Environment variable inventory

Values are not listed. Placeholders live in `server/.env.example`, `mobile/.env.example`, and `admin/.env.example`. Do not commit a real `.env`.

| Name | Where | Secret | Purpose | Rotation |
| --- | --- | --- | --- | --- |
| `PORT` | API | No | Listen port. Render sets this. | Host-controlled |
| `NODE_ENV` | API | No | `production` turns on the production guards. | n/a |
| `MONGODB_URI` | API | Yes | Must select database `helperbook` and, in production, use TLS. | Rotate the database user |
| `CLIENT_URL` | API | No | Comma-separated browser origins. Production requires `https://`. Mobile apps do not send an Origin header. | When the admin domain changes |
| `OTP_PROVIDER` | API | No | `mock` in development only. Production must be `twilio`. | n/a |
| `OTP_EXPIRY_MINUTES` | API | No | Reset-code lifetime. | n/a |
| `OTP_MAX_ATTEMPTS` | API | No | Tries per code. | n/a |
| `OTP_RESEND_COOLDOWN_SECONDS` | API | No | Resend wait. | n/a |
| `OTP_MAX_REQUESTS_PER_HOUR` | API | No | Per-phone send cap. | n/a |
| `OTP_MAX_IP_REQUESTS_PER_HOUR` | API | No | Per-IP send cap. | n/a |
| `OTP_VERIFY_MAX_PER_WINDOW` | API | No | Verify cap. | n/a |
| `REFRESH_MAX_PER_WINDOW` | API | No | Refresh cap. | n/a |
| `JWT_ACCESS_SECRET` | API | Yes | At least 32 characters. Rejects the example placeholder. | Rotate and expect existing access tokens to fail |
| `JWT_REFRESH_SECRET` | API | Yes | Same rule. | Same |
| `OTP_HASH_SECRET` | API | Yes | Hashes one-time codes. | Old unused codes stop matching |
| `ACCESS_TOKEN_EXPIRES_IN` | API | No | Example `15m`. | n/a |
| `REFRESH_TOKEN_EXPIRES_IN` | API | No | Example `30d`. | n/a |
| `TWILIO_ACCOUNT_SID` | API | Yes | Required when provider is Twilio. | Twilio console |
| `TWILIO_AUTH_TOKEN` | API | Yes | Required when provider is Twilio. | Twilio console |
| `TWILIO_FROM_NUMBER` | API | No | Sender number. | When the number changes |
| `TWILIO_VERIFY_SERVICE_SID` | API | Yes if used | Present in the example. The current provider uses the account token and from number. | Twilio console |
| `IMAGE_PROVIDER` | API | No | `cloudinary` in production. | n/a |
| `CLOUDINARY_CLOUD_NAME` | API | No | Required with Cloudinary. | n/a |
| `CLOUDINARY_API_KEY` | API | Yes | Required with Cloudinary. | Cloudinary console |
| `CLOUDINARY_API_SECRET` | API | Yes | Required with Cloudinary. | Cloudinary console |
| `RAZORPAY_KEY_ID` | API | No (publishable) | Also sent to the app for checkout. Production rejects `rzp_test_`. | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | API | Yes | Signature checks. | Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | API | Yes | Raw-body webhook signature. | Razorpay dashboard |
| `TRIAL_DURATION_DAYS` | API | No | Default 7. | Product decision |
| `TRIAL_PLAN` | API | No | Default `pro`. | Product decision |
| `STARTER_MONTHLY_PRICE` | API | No | Default 19. | Product decision |
| `BUSINESS_MONTHLY_PRICE` | API | No | Default 49. | Product decision |
| `PRO_MONTHLY_PRICE` | API | No | Default 149. | Product decision |
| `STARTER_YEARLY_PRICE` and the other yearly prices | API | No | Empty. Yearly billing is not configured. | Do not set 0 |
| `ADMIN_BOOTSTRAP_EMAIL` | API, one command | No | `node scripts/create-admin.js` only. | n/a |
| `ADMIN_BOOTSTRAP_PASSWORD` | API, one command | Yes | Same command. Remove after the admin exists. | After bootstrap |
| `ADMIN_BOOTSTRAP_NAME` | API, one command | No | Display name. | n/a |
| `ADMIN_BOOTSTRAP_ROLE` | API, one command | No | Default `super_admin`. | n/a |
| `EXPO_PUBLIC_API_URL` | Mobile, public | No | API base including `/api`. Release builds must use `https://`. Set it as an EAS environment variable for the production profile. | When the API host changes |
| `VITE_API_BASE_URL` | Admin build, public | No | Admin API base. Production must be the HTTPS API. | When the API host changes |

`BACKUP_DIR` is an argument to `server/scripts/backup-database.js`, not an application secret. Keep dumps outside the repository.
