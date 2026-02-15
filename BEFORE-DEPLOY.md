# Before you redeploy (read this)

## 1. Push code to GitHub first

Vercel builds from GitHub. If you don’t push, it deploys old code.

**In Cursor (with realty-collective open or in your sidebar):**

1. **Source Control** (branch icon, or Ctrl+Shift+G)
2. Click **+** next to "Changes" to stage all
3. Type message: `Update app`
4. Click **Commit** (✓)
5. **⋯** menu → **Push**

Or double‑click **DEPLOY-LIVE.bat** (must be inside the **realty-collective** folder).

---

## 2. Add env vars in Vercel (no Git needed)

Vercel → your project → **Settings** → **Environment Variables**.

- **Email OTP:** SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM  
- **SMS India (free):** FAST2SMS_API_KEY (from https://www.fast2sms.com/dashboard/dev-api)  
- **Database:** DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL  

Then **Redeploy** (Deployments → ⋮ → Redeploy).

---

## 3. Don’t open a different folder if you want to keep this chat

If you open **only** the `realty-collective` folder in Cursor, the app may start a **new chat** and this one disappears.

**Workaround:** Open the **parent** folder that **contains** realty-collective (e.g. **Desktop** or **Documents**). You’ll see both `realty-collective` and any other folders in the sidebar. Click into **realty-collective** to open its files and use its terminal. Same workspace = this chat can stay.

**Terminal in realty-collective:** Right‑click **realty-collective** in sidebar → "Open in Integrated Terminal", or run:  
`cd realty-collective`  
then run your commands (e.g. `npm run clear:demo` or Git commands).
