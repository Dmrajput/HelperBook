# Production incident response

Use `docs/security/incident-response.md` for leaked secrets and stolen sessions. This file adds the deployment steps.

## Outage

1. Check `GET /api/health` and `GET /api/ready` on the public API host.
2. Read the host logs for the request id. Do not copy secrets out of the log.
3. If the database is down, restore service from Atlas. Do not point the app at the development database.
4. If the API release is bad, roll back the Render deploy to the last good build. See `rollback-procedure.md`.
5. If the Android release is bad, halt the Play rollout. Phones that already installed it need a new version. Do not restore the database just because the app has a UI bug.

## Payment incident

1. Stop activating plans if verification looks wrong. The code already refuses payments that are not captured or that do not match the stored order.
2. Roll the Razorpay webhook secret if it may have leaked, then update the host and restart.
3. Do not delete payment rows to hide a duplicate. The unique payment id is what prevents double activation.

## Privacy incident

Tell affected shops if their personal or payment data was exposed. Do not send passwords or reset codes in that notice. Record the time found, the time contained, and who rotated credentials.
