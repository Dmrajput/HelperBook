# HelperBook Platform Admin

Vite + React admin portal for platform operators. It talks to `GET/POST/PATCH /api/admin/*` on the HelperBook API.

## Setup

```bash
cd admin
npm install
cp .env.example .env   # if present; otherwise create .env
npm run dev
```

Default Vite URL: `http://localhost:5173`

Required env:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The API must be running (`cd server && npm run dev`).

## Bootstrap the first Super Admin

Admins are **not** created from owner OTP. From the server package:

```bash
cd server
# set in .env (do not commit real secrets):
# ADMIN_BOOTSTRAP_EMAIL=you@example.com
# ADMIN_BOOTSTRAP_PASSWORD=choose-a-strong-password
# ADMIN_BOOTSTRAP_NAME=Super Admin
# ADMIN_BOOTSTRAP_ROLE=super_admin
node scripts/create-admin.js
```

Optional index sync (additive only):

```bash
node scripts/ensure-admin-indexes.js
```

## Auth model

- Bearer JWT + rotating refresh tokens stored in `AdminSession`
- Tokens are kept **in memory** in the browser (not `localStorage`)
- A full page reload clears the session — sign in again
- MFA is **not** implemented yet (Settings page states this)

Owner and employee JWTs are rejected on `/api/admin/*`.

## Roles (UI labels)

| Role | UI label |
|---|---|
| `super_admin` | Super Admin |
| `support_agent` | Support Admin |
| `finance_admin` | Billing Admin |
| `read_only_admin` | Analyst |

## Domain labels vs API

| UI | API path / resource |
|---|---|
| Companies | `/admin/shops` |
| Owners | `/admin/users` |
| Plans | `/admin/plan-pricing` |
| Overview | `/admin/dashboard/*` |

## Money

Subscription payment amounts are stored as **integer paise**. The API often exposes display amounts in whole rupees for admin UI. Never use floating money math for billing writes.

## Razorpay

Live refunds require Razorpay credentials on the server. Without them, refund requests are recorded as `requested` and are not provider-confirmed. Manual payments recorded in admin are labeled **manual** and are never treated as Razorpay-verified.

## Limitations

- No MFA
- Session does not survive full reload (by design)
- No SQL migrations (MongoDB / Mongoose additive indexes only)
- MRR is derived from current active paid plans (yearly ÷ 12), not cash accounting
- Hard company deletion and account impersonation are not offered
- Company access control uses `accessSuspended`

## Build

```bash
npm run build
```
