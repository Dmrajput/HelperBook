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

This route requires a bearer access token. The shop is the caller's active shop. A `shopId` query is ignored. Employee counts come from the employees collection. Today's attendance counts come from attendance records. A day with approved leave and no attendance record counts as leave. `leave.pendingRequests` is the number of leave requests waiting for approval. `salary.pendingAmount` and `salary.pendingEmployees` are finalized salaries whose payment status is unpaid. `salary.hasFinalized` is false when no salary has been finalized. `salary.allPaid` is true when finalized salaries exist and none are unpaid. `recentPayments` lists the latest paid salary payments. Advance outstanding comes from the khata ledger. It stays at zero when there are no advance transactions. A failed query returns an error instead of a zero.

## Advances

```text
POST  /api/advances
GET   /api/advances
GET   /api/advances/:id
GET   /api/advances/employee/:employeeId
POST  /api/advances/repayment
POST  /api/advances/adjustment
GET   /api/advances/transactions/:employeeId
GET   /api/advances/:id/transactions
POST  /api/advances/transactions/:transactionId/reverse
PATCH /api/advances/:id
```

These routes require a bearer access token. The shop is taken from that user. Outstanding advance is the sum of the khata ledger. A draft salary does not reduce the balance. Finalizing a salary posts one salary deduction, and reopening that salary reverses it.

## Leave

```text
POST  /api/leaves
POST  /api/leaves/record
GET   /api/leaves
GET   /api/leaves/history
GET   /api/leaves/employee/:employeeId
GET   /api/leaves/:id
POST  /api/leaves/:id/approve
POST  /api/leaves/:id/reject
POST  /api/leaves/:id/cancel
PATCH /api/shops/me/leave-settings
```

These routes require a bearer access token. The shop is taken from that user. A normal request stays pending until the owner approves it. Record Leave can save an approved or past leave. Approved leave is reflected in attendance when that day is not already marked, and salary uses its paid or unpaid treatment. Pending, rejected, and cancelled leave do not change salary. Approving leave does not rewrite a finalized salary.

## Attendance

```text
GET  /api/attendance/date/:date
POST /api/attendance
PUT  /api/attendance/:id
POST /api/attendance/bulk
GET  /api/attendance/month/:year/:month
GET  /api/attendance/history
GET  /api/attendance/employee/:employeeId
```

These routes require a bearer access token. The shop is taken from that user. Each employee can have one attendance record per date. Status values are `present`, `absent`, `half_day`, and `leave`. Dates use the shop calendar in `Asia/Kolkata`.

## Salary

```text
POST  /api/salaries/calculate
POST  /api/salaries/calculate-all
POST  /api/salaries/:id/recalculate
POST  /api/salaries/:id/finalize
POST  /api/salaries/:id/reopen
POST  /api/salaries/:id/pay
PATCH /api/salaries/:id
GET   /api/salaries/month/:year/:month
GET   /api/salaries/employee/:employeeId
GET   /api/salaries/:id
GET   /api/salaries/:id/receipt
GET   /api/salaries/:id/receipt/pdf
GET   /api/salaries/payments
GET   /api/salaries/payments/:paymentId
POST  /api/salaries/payments/:paymentId/reverse
```

These routes require a bearer access token. The shop is taken from that user. Salary totals are calculated on the server. A month has one salary record per employee. Draft records can be recalculated. Finalized records stay unchanged until they are reopened. Recording a payment does not change the calculated amount, leave, or advance balance. Only a finalized salary with a payable amount greater than zero can be paid, and only for that exact amount. A reversal keeps the payment record and returns the salary to unpaid. A paid salary must be reversed before it can be reopened. A salary receipt can be opened only after that payment. The receipt reads the finalized salary and the payment record. It does not recalculate or change them. The PDF is created when the owner asks for it and is not stored in the database.
