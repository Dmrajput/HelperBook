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

MongoDB is selected with `MONGODB_URI`. The database name must be `helperbook`. Do not put database credentials in source files.
