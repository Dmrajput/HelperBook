# Production architecture

Status on 9 October 2026: recommended, not deployed. No cloud account, domain, DNS zone, or production database was available in this workspace. Nothing below is a live URL.

## Recommendation

| Piece | Choice | Why |
| --- | --- | --- |
| API | Render Web Service, paid instance, Node start command `npm start` | The process already binds `0.0.0.0` and `PORT`. Render supplies HTTPS and restarts. The free instance sleeps after inactivity, so it is not the production choice. |
| Database | MongoDB Atlas, TLS, database name `helperbook`, IP allowlist limited to the API | The app refuses any database name other than `helperbook`. Local MongoDB has no TLS. |
| Admin panel | Render static site, built from `admin/` | The admin app is a separate Vite frontend. It must call the API with `VITE_API_BASE_URL`. |
| Files | Cloudinary | `IMAGE_PROVIDER=local` is rejected when `NODE_ENV=production` because Render disks are ephemeral. |
| Password-reset SMS | Twilio | `OTP_PROVIDER=mock` is rejected in production. |
| Subscriptions | Razorpay, server-side verification | Already implemented. Google Play billing is not. See the compliance checklist before shipping paid plans on Play. |
| Mobile | Expo Application Services production profile in `mobile/eas.json` | No native `android/` project exists. SDK 57's published Android target is API 36. The AAB has not been built. |
| TLS | Render managed certificates | Do not terminate TLS inside the Node process. |
| CI | Existing `.github/workflows/security.yml` | Tests and admin build only. It does not deploy. |

## Names that are not purchased here

Do not invent them. After the owner buys a domain, use:

- Public site or API legal pages: `https://<domain>/privacy`, `/terms`, `/delete-account`
- API: `https://api.<domain>`
- Admin: `https://admin.<domain>`

The API already serves `/privacy`, `/terms`, and `/delete-account` from `docs/legal`. Those routes are local until the service is deployed.

## Cost checked on 9 October 2026

Public pages, not a quote:

- Render compute "Less than 1 CPU / 512 MB" is listed at $7/month on [Render pricing](https://render.com/pricing). A second static site may add another instance. Recheck before purchase. Free web services spin down.
- MongoDB Atlas M0 is listed as free with 512 MB on [MongoDB pricing](https://www.mongodb.com/pricing). Do not use M0 for customer payroll if backups and network controls are insufficient. Paid shared tiers on that page start around $9/month for M2. Recheck the Atlas calculator for the chosen region and backup option.
- Twilio, Cloudinary, and Razorpay usage are separate and were not priced.

## What the owner must do before any deploy

1. Create the Render and Atlas accounts.
2. Create an Atlas database named `helperbook` with TLS and an application user that can read and write only that database. Create a separate backup user if the tier supports it.
3. Allow the Render egress addresses on the Atlas network access list. Do not open `0.0.0.0/0` unless no tighter option exists, and do not do that without authentication.
4. Put secrets only in the Render environment. Never commit them.
5. Set `NODE_ENV=production`. The process exits if MongoDB is not TLS, if `CLIENT_URL` is not a list of `https://` origins, if OTP is `mock`, if images are `local`, or if the Razorpay key id starts with `rzp_test_`.
6. Point DNS only at the records Render shows. This document does not contain an IP address or hostname because none was issued.
