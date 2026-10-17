# Production monitoring

Nothing here is configured on a live host. Set it up when Render and Atlas exist.

## Watch

- Render health check on `GET /api/health`. It must stay small and must not query MongoDB.
- Readiness `GET /api/ready` for deploy checks. It pings MongoDB and returns 503 when the database is down. It does not return a connection string.
- Render logs. Each production line includes the request id, method, path, status, and duration. Do not add request bodies.
- Atlas connections, disk, and backup status.
- Razorpay webhook failures. A non-200 is visible in Razorpay's dashboard.
- Play Console vitals after an upload: crashes and ANRs.
- Support tickets, including category `account_deletion`.

## Alerts to create on the host

1. Health check failing.
2. Ready check failing.
3. Process restarts looping.
4. Backup job failed.
5. Payment webhook signature failures above a handful in an hour.

Do not invent latency numbers. Set thresholds after the first week of real traffic.

## Logs must not contain

OTP codes, passwords, authorization headers, JWT secrets, Razorpay secrets, MongoDB URIs, or full salary and receipt bodies. `redactSensitive` covers connection strings, bearer tokens, and `[DEV OTP]` lines.
