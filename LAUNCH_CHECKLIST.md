# Launch Checklist – Realty Maitra

Use this before going live at **realtymaitra.propertywithmanish.com**.

## Pre-launch

- [ ] **Database**
  - Production DB is separate from demo/dev (e.g. separate Neon project or branch).
  - `npm run db:migrate:deploy` run against production `DATABASE_URL`.
  - No `npm run db:seed` or `npm run seed:demo` on production (seed is blocked in prod unless `ALLOW_SEED_IN_PRODUCTION=true`).

- [ ] **Environment variables (Vercel → Production)**
  - `DATABASE_URL` – Neon production connection string
  - `JWT_SECRET` – strong random secret (never commit)
  - `NEXT_PUBLIC_APP_URL` – `https://realtymaitra.propertywithmanish.com`
  - `NEXT_PUBLIC_HIDE_DEMO` – `true` (hides demo credentials / invite code on login/register)
  - Optional: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for OTP email

- [ ] **Subdomain**
  - In Vercel: Project → Settings → Domains → Add `realtymaitra.propertywithmanish.com`.
  - In your DNS (where propertywithmanish.com is managed): add CNAME `realtymaitra` → `cname.vercel-dns.com` (or value Vercel shows).

## Auth & access

- [ ] **New user signup**
  - Join page requires a valid Sponsor/Invite Code.
  - Signup is blocked without a valid code (test with invalid code).
  - After signup, user is linked to sponsor and gets a unique referral code.

- [ ] **Returning user login**
  - Password login works.
  - OTP login works (email → Send OTP → Verify OTP) without sponsor code.

- [ ] **Downline visibility**
  - Normal user sees only self + descendants (network/tree and list).
  - Admin can see all (e.g. admin network view / rootId).

## Security & reliability

- [ ] No secrets in repo (only `.env.example` with placeholders).
- [ ] Rate limiting: send OTP and verify OTP are rate-limited; test that excess requests return 429.
- [ ] Sentry (or chosen tool) is configured and receiving events; no sensitive data in logs.

## Content & performance

- [ ] Content library / training loads without storing heavy files in DB (metadata + URLs only).
- [ ] Videos use YouTube unlisted embed URLs where applicable.

## Backup & recovery

- [ ] Neon backups are enabled (or your provider’s backup policy is set).
- [ ] Disaster recovery steps are documented and tested (see PRODUCTION.md or README).

## Post-launch

- [ ] Test password login and OTP login on production URL.
- [ ] Test one full signup with valid sponsor code and one attempt with invalid code.
- [ ] Confirm admin can see full tree; non-admin only their downline.
