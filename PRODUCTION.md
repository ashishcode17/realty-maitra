# Production Setup – Realty Maitra

## Subdomain: realtymaitra.propertywithmanish.com

1. **Vercel**
   - Open your Vercel project (this app).
   - Settings → Domains → Add: `realtymaitra.propertywithmanish.com`.
   - Use the CNAME target Vercel shows (e.g. `cname.vercel-dns.com` or your project’s Vercel domain).

2. **DNS (where propertywithmanish.com is hosted)**
   - Add a CNAME record:
     - Name: `realtymaitra` (or `realtymaitra.propertywithmanish.com` depending on provider).
     - Value: the Vercel CNAME target from step 1.
   - Wait for propagation (up to 48h, often minutes).

3. **App URL**
   - In Vercel → Project → Settings → Environment Variables, set:
     - `NEXT_PUBLIC_APP_URL` = `https://realtymaitra.propertywithmanish.com`
   - Use the same value for Production (and optionally Preview). Redeploy after changing.

This app is a **separate deployment** from the main site (propertywithmanish.com). No code or config for the main site is changed.

---

## Required environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. Neon production). |
| `JWT_SECRET` | Yes | Secret for signing JWTs. Use a long random string. |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL, e.g. `https://realtymaitra.propertywithmanish.com`. |
| `NEXT_PUBLIC_HIDE_DEMO` | Recommended | Set to `true` in production to hide demo credentials/invite code on login/register. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | For OTP email | Needed to send OTP and welcome emails. Without these, OTP is only logged in dev. |

Set these in Vercel (Settings → Environment Variables) for Production (and Preview if you want). Never commit real secrets; use `.env.example` only as a template.

---

## Demo vs production

- **Production DB**: Use a dedicated Neon project or branch for live data. Do not use the same DB as demo/testing.
- **Seeding**: `npm run db:seed` is **blocked** when `NODE_ENV=production` unless `ALLOW_SEED_IN_PRODUCTION=true`. Use that only for a one-time initial admin seed, then remove the variable.
- **Demo data**: `npm run seed:demo` is for local/dev only. Do not run it against production.

---

## Backup and disaster recovery

1. **Neon**
   - Ensure Neon’s backup / point-in-time recovery is enabled for the production branch (see Neon dashboard).

2. **Scheduled exports (optional)**
   - Use a cron job or script to run `pg_dump` against production and store the result in secure storage (e.g. S3/R2/Drive).
   - Example (run from a secure host with network access to DB):
     ```bash
     pg_dump "$DATABASE_URL" --no-owner --no-acl -F c -f backup-$(date +%Y%m%d).dump
     ```
   - Upload to your chosen storage and rotate (e.g. keep last 4 weekly backups).

3. **Restore**
   - Restore from Neon’s point-in-time restore, or from a `pg_dump` file using `pg_restore` (or `psql` for plain SQL dumps).

---

## Rate limiting

- **Login / register**: 10 requests per minute per IP.
- **Send OTP**: 5 per 15 minutes per IP.
- **Verify OTP**: 15 per 15 minutes per IP.

Responses use `429` with `Retry-After` when limits are exceeded.

---

## Admin and audit

- Sensitive actions (e.g. user created, role changed, disabled, sponsor linked) should be recorded in `AuditLog` (or your chosen audit store).
- Admin tools: create/disable users, view full tree, regenerate referral code. Use server-side checks so only admin role can perform these.
