# HelperBook marketing site — launch checklist

## Required before public launch

- [ ] Set production `VITE_SITE_URL` and regenerate sitemap/robots if needed
- [ ] Set `VITE_ALLOW_INDEXING=true` only on the production marketing host
- [ ] Add the marketing origin to server `CLIENT_URL`
- [ ] Confirm `supportEmail` / `demoInboxEmail` in Admin → Settings
- [ ] Configure SMTP (`EMAIL_PROVIDER=smtp` + `SMTP_*`) if visitor/inbox email is required
- [ ] Owner-review Privacy and Terms copy (pages show review banners)
- [ ] Confirm legal company name, address, phone, WhatsApp (only publish verified values)
- [ ] Replace illustrative product previews with approved real screenshots (no sensitive data)
- [ ] Decide retention period for demo/inquiry leads (do not invent a period in public copy)
- [ ] Smoke-test Book a demo and Contact on mobile (~360px)
- [ ] Verify admin **Leads & demos** list, filters, status update, internal notes

## Optional

- [ ] `VITE_APP_DOWNLOAD_URL` / `VITE_LOGIN_URL` when public destinations exist
- [ ] `VITE_ANALYTICS_ENDPOINT` for privacy-conscious event collection
- [ ] CDN/prerender service for richer social crawler HTML beyond static route shells

## Out of scope / not claimed

- MFA, biometric attendance, GPS check-in, WhatsApp automation, AI, bank payroll rails
- Fake testimonials, customer logos, awards, or response-time SLAs
- Confirmed calendar bookings without a real scheduling provider
