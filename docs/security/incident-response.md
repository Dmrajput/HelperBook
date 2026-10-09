# Incident response

Use this when a token, database, payment secret, or customer data may be exposed.

1. Identify what leaked: access secret, refresh secret, OTP hash secret, Razorpay key secret, webhook secret, Twilio token, MongoDB URI, or a database dump.
2. Revoke or rotate that credential in the provider or host. Update the deployment environment. Do not commit the new value.
3. Restart the API so the process loads the new secret. Old JWTs fail verification after `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` changes.
4. If sessions may be stolen, revoke them. Owner sessions live in `sessions` (`revokedAt`). Employee sessions live in `employeesessions`. Admin sessions live in `adminsessions`.
5. If a Razorpay secret leaked, roll the key in the Razorpay dashboard and set the new webhook secret before the next payment.
6. If the database was exposed, take a fresh backup of the current state, then restore service from a known-good copy only if the live data cannot be trusted. Do not restore over production until the copy has been checked in a separate database.
7. Write down the time the issue was noticed, the time it was contained, who rotated credentials, and which customers were affected. Do not put secrets or OTPs in that note.
8. Tell affected shops if their payment or personal data was exposed. Do not send passwords or OTPs by email or SMS as part of the notice.

Admin audit logs are append-only through the API. Do not delete them to hide an incident.
