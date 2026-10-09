# Authentication and authorization

HelperBook has three identities. They do not share tokens.

| Identity | Access token claims | Session collection |
|---|---|---|
| Owner | `sub`, `role: owner`, `sid`, `type: access` | `Session` |
| Employee | `sub`, `role: employee`, `shopId`, `sid`, `type: access` | `EmployeeSession` |
| Admin | `sub`, `role: admin`, `adminRole`, `sid`, `type: admin_access` | `AdminSession` |

Access tokens expire in about 15 minutes (`ACCESS_TOKEN_EXPIRES_IN`). Owner and employee refresh tokens follow `REFRESH_TOKEN_EXPIRES_IN` (30 days in the example). Admin refresh tokens last 7 days. Signing uses `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, which must be at least 32 characters and are rejected at startup if they contain `replace_with`. Verification allows only HS256.

Every protected request loads the session named by `sid`. A revoked, expired, or mismatched session is rejected even if the JWT signature is still valid. Logout revokes that session. Logout-all revokes the owner’s open sessions. Suspending an owner sets `isActive` false and revokes sessions. Disabling employee login or deactivating the employee revokes employee sessions. A disabled admin cannot refresh or continue with an existing access token.

Refresh tokens are stored as hashes. Owner refresh rotation uses a conditional update. If the presented hash is no longer current, the session is revoked.

Mobile apps store tokens in Expo Secure Store. The admin app keeps tokens in memory for the tab and does not use `localStorage`.

Admin permissions are in `server/src/config/adminPermissions.js` and are checked by `requireAdminPermission` on the server. A read-only admin cannot suspend users. A support agent cannot refund or change subscriptions. Only a super admin can manage settings and admin accounts.

There is no public admin registration. The first admin is created with `node server/scripts/create-admin.js` from `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`. The command will not replace an existing email.

Multi-factor authentication is not implemented.
