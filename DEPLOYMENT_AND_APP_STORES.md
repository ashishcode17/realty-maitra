# Realty Maitra – Deployment & App Store / Play Store Guide

You have two different goals. This doc explains both and how to do them **without breaking your current setup** (Docker DB + PowerShell running the app locally).

---

## Part 1: What You Have vs What You Want

| What you have now | What “deploy” usually means | What “App Store / Play Store” means |
|-------------------|-----------------------------|-------------------------------------|
| App runs on **your PC** (PowerShell), DB in **Docker** on your PC. Only you can open it (e.g. `http://localhost:3000`). | Put the **same web app** on a **server on the internet** so anyone can open it with a URL (e.g. `https://realtymaitra.vercel.app`). | Put an **installable app** in Apple’s App Store and/or Google’s Play Store so people can download it on their phone. |

**Important:** Your project is a **website** (Next.js). It is **not** yet an “app” in the store sense. So:

- **Deploy** = make the website live on the internet (same app, just reachable by URL). **No store account needed.**
- **Stores** = you need to either turn the website into an installable app (e.g. PWA wrapper) or build a separate mobile app. **Store accounts and fees apply.**

---

## Part 2: Deploying the Web App (Make It Live on the Internet)

This does **not** change your local setup. You keep using Docker + PowerShell as you do now. Deployment uses a **separate** copy of the app and a **separate** database.

### What you need

1. **A place to run the app** (hosting)  
2. **A database** that the hosted app can reach (your Docker DB is only on your PC, so you need a **cloud DB** for production)

### Recommended (simple and low-cost)

- **Hosting:** [Vercel](https://vercel.com) – free tier, works very well with Next.js.  
- **Database:** [Neon](https://neon.tech) or [Supabase](https://supabase.com) – free tier PostgreSQL.

### Steps (high level)

1. **Create a cloud database (production only)**  
   - Sign up at [Neon](https://neon.tech) (or Supabase).  
   - Create a project and copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).  
   - You will use this **only** for the deployed app. Your local `.env` keeps pointing to Docker; nothing changes locally.

2. **Put your code on GitHub**  
   - Create a repo, push your `realty-collective` project.  
   - If you don’t want to use Git yet, you can use Vercel’s “Import” and upload a ZIP, but Git is better for updates.

3. **Deploy on Vercel**  
   - Sign up at [Vercel](https://vercel.com).  
   - “Add New Project” → Import your GitHub repo (or upload).  
   - In **Environment Variables**, add:  
     - `DATABASE_URL` = the **Neon** (or Supabase) connection string from step 1.  
   - Deploy. Vercel will run `npm run build` and `npm run start` for you.  
   - You get a URL like `https://your-project.vercel.app`. That’s your **live** app.

4. **Run migrations on the production DB**  
   - One-time: point Prisma at the **production** `DATABASE_URL` and run migrations.  
   - Easiest: on your PC, temporarily set `DATABASE_URL` to the Neon URL in `.env`, then run:
     - `npx prisma migrate deploy`  
   - Then set `DATABASE_URL` back to your Docker URL so local stays unchanged.

5. **Optional: custom domain**  
   - In Vercel you can add a domain (e.g. `app.realtymaitra.com`). Often ~$10–15/year from a registrar.

**Summary:**  
- Local: Docker DB + PowerShell → unchanged.  
- Production: Vercel (app) + Neon (DB) → separate; nothing touches your current setup.

---

## Part 3: App Store and Play Store – What’s Involved

Your app is a **web app**. Stores want **installable apps**. You have two main paths.

### Option A: “Wrap” your website (PWA / TWA)

- Turn your site into an installable **Progressive Web App (PWA)** or use **Trusted Web Activity (TWA)** so it can be submitted to the stores.  
- **Google Play:** You can publish a TWA (Chrome-based wrapper) around your URL. One-time fee **$25**.  
- **Apple App Store:** Apple is stricter. Wrapping a plain website often gets rejected. You may need a thin native shell (e.g. **Capacitor**) and some native features; even then, approval isn’t guaranteed for “just a website.”  
- **Costs:**  
  - Google: **$25** one-time.  
  - Apple: **$99/year** (developer account required to submit).

### Option B: Build a real mobile app

- Use **React Native**, **Flutter**, or **Capacitor** to build an app that uses your same backend (same API, same database).  
- More work, but better chance of approval and a better “app” experience.  
- Same store fees: Google $25 one-time, Apple $99/year.

### Cost summary (stores only)

| Item | Cost |
|------|------|
| Google Play Developer account | **$25** one-time |
| Apple Developer account | **$99/year** |
| Hosting (e.g. Vercel) | **Free** tier possible |
| Database (e.g. Neon) | **Free** tier possible |
| Custom domain | Optional, ~**$10–15/year** |

So: **minimum to be on both stores** = $25 + $99 (first year) = **$124**, plus ongoing **$99/year** for Apple if you stay on the App Store.

---

## Part 4: Safe Order and “Don’t Jeopardize Anything”

1. **Keep local as-is**  
   - Don’t change your existing `.env` for daily work.  
   - Use a **separate** `.env.production` or Vercel env vars only for production `DATABASE_URL`.

2. **Deploy the web app first**  
   - Get the app live on Vercel + Neon.  
   - Test login, register, main flows on the **deployed** URL.  
   - Your local Docker + PowerShell setup stays the same; only the **deployed** app uses the cloud DB.

3. **Then consider stores**  
   - After the website works in production, you can:  
     - Share the URL so users open it in the browser (no store needed), or  
     - Add “Add to Home Screen” (PWA) so it feels like an app on phones, or  
     - Build a store listing (TWA for Play Store; for Apple, plan for possible rejection of a simple wrapper).

4. **Backups**  
   - Export your Neon DB periodically (Neon has backups; you can also use `pg_dump`).  
   - Keep your code in Git (e.g. GitHub) so you can always redeploy or roll back.

---

## Part 5: Quick Command Reference (Local vs Production)

**Local (unchanged):**

```powershell
# Ensure Docker Postgres is running, then:
cd realty-collective
# .env has DATABASE_URL pointing to Docker
npm run dev
```

**Production (only when you want to deploy):**

- **Migrations on production DB** (one-time or when you add migrations):
  - Set `DATABASE_URL` to your **Neon** URL (in a separate env or temporarily in `.env`).
  - Run: `npx prisma migrate deploy`
  - Switch `DATABASE_URL` back to Docker for local.

- **Vercel** runs `npm run build` and `npm run start` automatically; you only set `DATABASE_URL` in the Vercel dashboard.

---

## TL;DR

- **Deploy** = Put the web app on the internet (e.g. Vercel + Neon). Your local Docker + PowerShell setup can stay exactly as is; use a separate production database.
- **App Store / Play Store** = Different step: you need to make an “installable app” (PWA/TWA or native) and pay **Google $25** (one-time) and **Apple $99/year**.
- **To avoid breaking anything:** Use a **separate** production `DATABASE_URL` (Neon) for the deployed app; keep your current `.env` for local development. Deploy first, then decide if you need the stores.

If you tell me whether you want to start with “just deploy the website” or “deploy + prepare for stores,” I can give you a minimal step-by-step checklist (e.g. click-by-click for Vercel + Neon).
