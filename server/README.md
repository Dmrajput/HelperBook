# HelperBook API

Express API for HelperBook.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`, then start the server:

```bash
npm run dev
```

Production:

```bash
npm start
```

## Health

`GET /api/health` does not require authentication.

## Authentication

```text
POST /api/auth/request-otp
POST /api/auth/verify-otp
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/logout-all
GET  /api/auth/me
```

`logout`, `logout-all`, and `me` require a bearer access token. OTP codes and refresh tokens are stored only as hashes. With `OTP_PROVIDER=mock` and `NODE_ENV=development`, the OTP is printed in the server console and is never returned by the API.

MongoDB is selected with `MONGODB_URI`. The database name must be `helperbook`. Do not put database credentials or JWT secrets in source files.

## Shop

```text
POST   /api/shops
GET    /api/shops/me
PUT    /api/shops/me
POST   /api/shops/me/logo
DELETE /api/shops/me/logo
```

Every shop route requires a bearer access token. The owner is taken from that token. `IMAGE_PROVIDER=local` stores logo files on this computer and is refused in production. `IMAGE_PROVIDER=cloudinary` uploads logos with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Those values stay in `server/.env`.

## Employees

```text
POST   /api/employees
GET    /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
PATCH  /api/employees/:id/status
DELETE /api/employees/:id
```

These routes require a bearer access token. The shop is taken from that user. A request cannot choose another shop. `EMPLOYEE_ALLOW_FUTURE_JOINING_DATE=true` is optional and allows a joining date after today. The default rejects future joining dates.

## Dashboard

```text
GET /api/dashboard
```

This route requires a bearer access token. The shop is the caller's active shop. A `shopId` query is ignored. Employee counts come from the employees collection. Attendance, salary, and advance totals stay at zero when those collections have no records. A failed query returns an error instead of a zero.
