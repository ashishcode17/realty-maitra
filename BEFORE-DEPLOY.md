# Before you redeploy (read this)

## 1. Push code to GitHub first

Vercel builds from GitHub. If you don’t push, it deploys old code.

**In Cursor (with realty-collective open or in your sidebar):**

1. **Source Control** (branch icon, or Ctrl+Shift+G)
2. Click **+** next to "Changes" to stage all
3. Type message: `Update app`
4. Click **Commit** (✓)
5. **⋯** menu → **Push**

Or double‑click **DEPLOY-LIVE.bat** — and make sure that file is inside **realty-collective**, not realty-collective-COMPLETE.

### Why don't I see my changes on the live site?

- **Two folders:** Edits were made in **realty-collective**. If your live site is built from **realty-collective-COMPLETE** (or another repo), it will never show those changes.
- **Do this:** Run **DEPLOY-LIVE.bat** from inside the **realty-collective** folder (File Explorer → `realty-collective` → double‑click the bat file). Don't run it from realty-collective-COMPLETE.
- **Vercel:** Settings → Git → check which repository is connected. It must be the repo you push from when you're in realty-collective.
- **Cache:** After deploy, do a hard refresh on the site (Ctrl+Shift+R) to avoid old cached files.

---

## 2. Add env vars in Vercel (no Git needed)

Vercel → your project → **Settings** → **Environment Variables**.

- **Database:** `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`
- **Email OTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- **SMS (India):** `FAST2SMS_API_KEY` (from https://www.fast2sms.com/dashboard/dev-api)
- **Create DEMO1234 on deploy (optional):**  
  Set **once** for first deploy (or after clearing users):  
  `ALLOW_SEED_ON_DEPLOY` = `true`  
  `ALLOW_SEED_IN_PRODUCTION` = `true`  
  After the first successful deploy you can set `ALLOW_SEED_ON_DEPLOY` to `false` so seed doesn’t run on every deploy.

**What happens when you deploy:**  
The build runs `prisma migrate deploy` (applies DB migrations) and, if the two seed vars above are set, runs the seed so the sponsor code **DEMO1234** exists. You don’t need to run seed or migrations locally.

Then **Redeploy** (Deployments → ⋮ → Redeploy) if you only changed env vars.

---

## 3. Don’t open a different folder if you want to keep this chat

If you open **only** the `realty-collective` folder in Cursor, the app may start a **new chat** and this one disappears.

**Workaround:** Open the **parent** folder that **contains** realty-collective (e.g. **Desktop** or **Documents**). You’ll see both `realty-collective` and any other folders in the sidebar. Click into **realty-collective** to open its files and use its terminal. Same workspace = this chat can stay.

**Terminal in realty-collective:** Right‑click **realty-collective** in sidebar → "Open in Integrated Terminal", or run:  
`cd realty-collective`  
then run your commands (e.g. `npm run clear:demo` or Git commands).
