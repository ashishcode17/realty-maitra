# Before you redeploy (read this)

## 0. Empty the app for official launch (one-time)

To remove **all** projects, **all** training, and **all** offers so you can add real data:

1. Open the **realty-collective** folder in Cursor.
2. In `.env` set `DATABASE_URL` to your **production** database (copy from Vercel → Project → Settings → Environment Variables, or use your Neon connection string).
3. In the terminal (from realty-collective):  
   `npm run clear:launch`  
4. When it finishes, Projects, Training, and Offers will be empty. Refresh the app and start adding real data.

**If you run this against your live DB, it clears everything immediately.** Back up first if needed.

---

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

Follow this checklist. **One mismatch is enough** for Vercel to build the wrong code.

1. **Run deploy from the right folder**  
   Run **DEPLOY-LIVE.bat** from inside **realty-collective** only (e.g. File Explorer → open `realty-collective` → double‑click the bat). Don’t run it from Desktop or from realty-collective-COMPLETE.

2. **Confirm which GitHub repo you’re pushing to**  
   After running the bat file, check the line that says “Pushing to GitHub…”.  
   Or in Cursor: open a terminal in **realty-collective** and run:  
   `git remote -v`  
   Note the URL (e.g. `https://github.com/YourName/some-repo.git`).

3. **Vercel must use that same repo**  
   Vercel → your project → **Settings** → **Git**:
   - **Connected Git Repository** must be the **exact same** repo as the one from step 2. If Vercel is connected to a different repo (e.g. one that has realty-collective-COMPLETE), it will never build your realty-collective changes.
   - **Production Branch** is usually `main`. Your batch file pushes to `main`; if Vercel’s production branch is something else (e.g. `master`), change it to `main` or push to that branch instead.
   - **Root Directory** must be blank (or `.`) so Vercel builds from the repo root. Your realty-collective folder *is* the repo root when you push from it, so no subfolder should be set.

4. **Make sure the push actually succeeds**  
   When the batch file finishes, it should say “DONE. GitHub updated.” and **not** “PUSH FAILED”. If push fails (e.g. login popup cancelled), GitHub never gets your changes and Vercel has nothing new to build.

5. **Confirm Vercel built the latest commit**  
   Vercel → **Deployments** → click the latest deployment → check the **commit message** and **commit hash**. They should match your latest “Update live app” (or whatever you committed). If the deployed commit is old, Vercel is either not getting pushes or is building from the wrong branch/repo.

6. **Hard refresh the site**  
   After a new deploy, do a hard refresh so the browser doesn’t show cached files: **Ctrl+Shift+R** (or Cmd+Shift+R on Mac).

### “Resource is limited – try again in 15 hours” (100 deploys/day)

On the **free (Hobby) plan**, Vercel limits you to **100 deployments per day** (see [Vercel Limits](https://vercel.com/docs/limits/overview): “Deployments Created per Day” = 100 for Hobby). So the free tier is **not** unlimited deploys.

- **When you see it:** You’ve hit that daily limit. The counter resets after the stated time (e.g. 15 hours).
- **What to do now:** Wait until the limit resets, or upgrade to **Pro** (6,000 deploys/day).
- **To avoid hitting it:** Don’t run DEPLOY-LIVE.bat on every tiny change. Make several edits, then commit once and push once so one push = one deployment.

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
