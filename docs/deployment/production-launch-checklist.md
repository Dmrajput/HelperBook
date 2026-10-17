# Production launch checklist

Statuses on 9 October 2026. An item is Passed only with evidence.

## Gate A — Infrastructure

| Item | Status | Evidence |
| --- | --- | --- |
| Production MongoDB | Not started | No Atlas cluster in this workspace |
| TLS and network restriction | Not started | Local URI is `mongodb://localhost` |
| Backup process | Blocked | Script exists. No dump was taken. Restore was not tested |
| Backend deployed | Not started | API runs locally on port 5000 |
| Health checks | In progress | `GET /api/health` and `GET /api/ready` exist in code. Not checked on a public host |
| Domain and HTTPS | Not started | No domain was provided |
| Secrets on the host | Not started | Secrets are local only |
| Logs | In progress | Production log line includes a request id. Host retention is not configured |

## Gate B — Application

| Item | Status | Evidence |
| --- | --- | --- |
| Release API URL | Blocked | `EXPO_PUBLIC_API_URL` is still a LAN address for development. Release builds reject non-HTTPS in code. No release binary |
| Authentication | In progress | Password login and reset-code flow are in the code. Not exercised on production Twilio |
| Shop isolation | Passed in local tests | `npm test` in `server/`: 8 passed, 0 failed, on 9 October 2026 |
| Payment verification | Blocked | Razorpay keys are not set. Play billing is not implemented |
| Reports and receipts | Not started on a device | Code exists. No production export was run |
| Account deletion | In progress | In-app request and public draft page exist. No public URL and no completed deletion |
| Critical blockers | Failed | Billing, hosting, and the missing AAB remain |

## Gate C — Google Play

| Item | Status | Evidence |
| --- | --- | --- |
| AAB built | Not started | `eas.json` production profile is `app-bundle`. Build was not run |
| Package and signing | Not started | Package is `com.helperbook.app`. No signing identity to verify |
| Target API | Not verified | SDK 57 documentation says target 36. Artifact not inspected |
| Privacy and terms published | Not started | Drafts only |
| Data safety | In progress | Inventory is in the compliance checklist. Form not submitted |
| Store listing | In progress | Draft text only. No screenshots |
| Internal testing | Not started | |
| Closed testing | Not started | Confirm whether this Play account needs 12 testers for 14 days |
| Billing policy | Failed | Razorpay WebView without Play billing |
| Production rollout | Not started | Owner has not approved a release |

Do not start Gate C while the billing blocker is open. Do not press production rollout from this repository.
