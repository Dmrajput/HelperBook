# Backup and recovery

The repository is configured for a self-hosted MongoDB database named `helperbook`. This workspace does not use MongoDB Atlas. `mongodump` is not installed on the development machine, so a dump-and-restore test was **not** completed. Do not treat this document as proof that a backup can be restored.

## Targets

- Recovery point objective: 24 hours once daily dumps are running.
- Recovery time objective: 4 hours for a single-database restore on the same host size, after the dump is available.
- Retention: 30 daily dumps, then delete older files. Do not keep dumps forever.
- Storage: outside the Git repository, on encrypted disk or a private bucket. Restrict the backup credential to backup/read access. Do not use the application user as the only backup account in production.

## Backup

Install MongoDB Database Tools so `mongodump` is on the path. Point `BACKUP_DIR` at a directory outside this repository, then run:

```text
MONGODB_URI="mongodb://backup-user:secret@host:27017/helperbook?authSource=admin" BACKUP_DIR=/secure/helperbook-backups node server/scripts/backup-database.js
```

The script refuses to write inside the repository and does not contain a password. Schedule it daily. Alert if the process exits non-zero. Confirm the dump directory contains the `helperbook` folder and a non-zero size before considering the backup complete.

Production connection strings should use TLS (`tls=true` or `mongodb+srv`) and a user that can read and write only the `helperbook` database. The application must not connect as the MongoDB root user.

## Restore

Restore into an empty database name such as `helperbook_restore_check`. Do not restore over the live `helperbook` database.

```text
mongorestore --uri "mongodb://localhost:27017" --nsFrom "helperbook.*" --nsTo "helperbook_restore_check.*" /secure/helperbook-backups/helperbook
```

Then check, from a client pointed at `helperbook_restore_check`:

- Expected collections exist, including users, shops, employees, attendance, salaries, subscriptions, subscription payments, and admin audit logs.
- Unique indexes exist for phone login, shop owner, Razorpay order id, webhook event id, and coupon code.
- A known shop still points at its owner, and its subscription and payments share that shop id.
- Audit logs are present and were not truncated.

Record the wall-clock time of the restore. Drop `helperbook_restore_check` when the check is finished.

If a restore must replace production, stop the API, restore into a new database name, run the checks, change `MONGODB_URI` to that name only after the checks pass, and start the API. Keep the previous database until the new one has served real reads successfully.

## This workspace

`mongodump` was not found. No restore duration was measured. Disaster recovery is not complete until the commands above succeed on the deployment that will hold production data.
