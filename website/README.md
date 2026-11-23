# HelperBook marketing website

Static React (Vite) marketing site for HelperBook. It talks to the HelperBook API for platform contact details, pricing plans, and lead forms.

## Setup

```bash
cd website
npm install
cp .env.example .env
```

Edit `.env` with your API base URL and site URL.

## Development

```bash
npm run dev
```

Runs on [http://localhost:5174](http://localhost:5174) by default.

## Build

```bash
npm run build
```

Runs `vite build` then `scripts/prerender.mjs`, which duplicates `index.html` into per-route folders for static hosts and optionally rewrites `robots.txt` / `sitemap.xml` when `VITE_SITE_URL` is set.

```bash
npm run preview
```

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | HelperBook API base (e.g. `http://localhost:5000/api`) |
| `VITE_SITE_URL` | Canonical public URL for SEO and prerender sitemap/robots |
| `VITE_ALLOW_INDEXING` | Set `true` in production only when legal/owner approves indexing |
| `VITE_APP_DOWNLOAD_URL` | Optional app download link |
| `VITE_LOGIN_URL` | Optional sign-in link in the header |
| `VITE_ANALYTICS_ENDPOINT` | Optional first-party analytics (no PII) |

## API dependency

These public endpoints must be available for full functionality:

- `GET /api/public/platform` — contact and branding overrides
- `GET /api/public/plans` — pricing (free plan excluded server-side)
- `POST /api/public/demo-requests` — book demo form
- `POST /api/public/inquiries` — contact form

Without the API, pages still render; pricing and forms show error states, and contact blocks fall back to values in `src/config/site.js`.

## Limitations

- **Email**: Acknowledgement emails to leads depend on server mail configuration; the website does not send mail itself.
- **Search indexing**: Default `VITE_ALLOW_INDEXING=false` and `noindex` on legal pages until the owner enables indexing.
- **Legal review**: Privacy and terms pages include an owner-review banner; do not launch without review.
- **Prerender**: Route copies use the same SPA shell—no server-side React render. Enable client-side routing fallback on your host or use the generated `*/index.html` paths.
- **Preferred demo date**: A request only; confirmation happens outside the form.

## Stack

React 19, React Router, TanStack Query, React Hook Form + Zod, Tailwind CSS v4, Lucide icons.