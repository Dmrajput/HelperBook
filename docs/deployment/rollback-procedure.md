# Rollback

No production deploy has been made, so there is no previous live release to restore yet.

## API

1. In Render, select the last deploy that passed `GET /api/health` and `GET /api/ready`.
2. Redeploy that build. Do not change `MONGODB_URI` as part of a code rollback.
3. Confirm login on a test account.
4. Do not run a script that drops or reseeds `helperbook`.

## Database

1. Stop writes if the data itself is corrupt.
2. Restore the dump into a new database name first, using `docs/security/backup-and-recovery.md`.
3. Point the API at that database only after the checks pass and the name in the URI is still `helperbook` or the restore was loaded under that name on purpose.
4. Never restore over the live database as the first step.

## Android

1. Halt the staged rollout in Play Console.
2. Ship a corrected AAB with a higher version code.
3. A rollback does not uninstall the bad build from phones that already updated.

## What not to do

- Do not generate a new upload key to replace a bad release.
- Do not turn off authentication or payment checks to make the app look healthy.
- Do not commit the keystore or the production `.env`.
