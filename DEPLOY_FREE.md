# Make Your Web App Live – 100% Free

Use **Vercel** (hosting) + **Neon** (database). Both have free tiers. Your local setup (Docker + PowerShell) stays unchanged.

---

## What You’ll Need (all free)

- **GitHub account** – [github.com](https://github.com) (free)
- **Vercel account** – [vercel.com](https://vercel.com) (free)
- **Neon account** – [neon.tech](https://neon.tech) (free)

---

## Step 1: Create a free cloud database (Neon)

1. Go to **https://neon.tech** and sign up (GitHub login is fine).
2. Click **New Project**. Name it e.g. `realty-maitra-prod`, pick a region close to you.
3. After it’s created, you’ll see a **Connection string**. It looks like:
   ```text
   postgresql://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Click **Copy** and save it somewhere safe (you’ll paste it into Vercel in Step 4).  
   **Don’t put it in your local `.env`** – keep using Docker for local.

---

## Step 2: Put your code on GitHub

1. Install **Git** if you don’t have it: [git-scm.com](https://git-scm.com).
2. On **github.com**, click **New repository**. Name it e.g. `realty-maitra`, leave it empty (no README).
3. On your PC, open **PowerShell** and go to your project folder:
   ```powershell
   cd C:\Users\Ashish\Desktop\realty-collective
   ```
4. Run (replace `YOUR_USERNAME` and `realty-maitra` with your GitHub username and repo name):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/realty-maitra.git
   git push -u origin main
   ```
   If Git asks for login, use your GitHub username and a **Personal Access Token** (Settings → Developer settings → Personal access tokens) instead of your password.

---

## Step 3: Deploy on Vercel

1. Go to **https://vercel.com** and sign up (e.g. “Continue with GitHub”).
2. Click **Add New…** → **Project**.
3. **Import** the repo you just pushed (e.g. `realty-maitra`). Click **Import**.
4. **Do not click Deploy yet.** First add environment variables (Step 4).

---

## Step 4: Add environment variables in Vercel

1. On the same Vercel “Configure Project” page, find **Environment Variables**.
2. Add these **one by one** (name exactly as below):

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | (paste the **Neon** connection string from Step 1) | Required |
   | `JWT_SECRET` | (any long random string, e.g. 32+ characters) | Required; e.g. use a password generator |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | **After first deploy:** replace with your real Vercel URL (e.g. `https://realty-maitra.vercel.app`) |

   For **NEXT_PUBLIC_APP_URL**: you can leave it as `https://your-project.vercel.app` for the first deploy, then edit it in Vercel (Project → Settings → Environment Variables) to your actual URL once Vercel shows it (e.g. `https://realty-maitra-xxx.vercel.app`).

3. Click **Deploy**. Wait a few minutes.

---

## Step 5: Run database migrations on the production DB

Vercel only runs your app; it doesn’t run Prisma migrations. You run them once against the **Neon** database.

1. On your PC, open a **new** PowerShell window.
2. Go to the project folder:
   ```powershell
   cd C:\Users\Ashish\Desktop\realty-collective
   ```
3. **Temporarily** point Prisma at the production DB. Either:
   - **Option A:** Set the variable just for this command (replace with your real Neon URL):
     ```powershell
     $env:DATABASE_URL="postgresql://user:pass@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
     npx prisma migrate deploy
     ```
   - **Option B:** Create a file `.env.production` (don’t commit it) with only:
     ```text
     DATABASE_URL="postgresql://...your Neon URL..."
     ```
     Then run:
     ```powershell
     npx dotenv -e .env.production -- npx prisma migrate deploy
     ```
     (If you don’t have `dotenv` CLI: `npm install -g dotenv-cli` or use Option A.)
4. After it succeeds, **don’t** keep the Neon URL in your normal `.env`. Your normal `.env` should still point to **Docker** for local dev.

---

## Step 6: (Optional) Seed the production database

If you want an admin user and sample data on the **live** site:

1. With `DATABASE_URL` set to the **Neon** URL (same as Step 5), run:
   ```powershell
   npx prisma db seed
   ```
   or, for demo data:
   ```powershell
   npm run seed:demo
   ```
2. Then switch `DATABASE_URL` back to your local Docker URL in `.env` for daily use.

---

## Step 7: Set the real app URL (after first deploy)

1. In Vercel, open your project and copy the **live URL** (e.g. `https://realty-maitra-abc123.vercel.app`).
2. Go to **Project → Settings → Environment Variables**.
3. Edit `NEXT_PUBLIC_APP_URL` and set it to that URL (e.g. `https://realty-maitra-abc123.vercel.app`).
4. **Redeploy:** Deployments → three dots on latest → **Redeploy**.

---

## You’re done

- **Live app:** Open the Vercel URL in a browser. Login/register will use the Neon database.
- **Local:** Keep using `npm run dev` with Docker; your local `.env` still points to `localhost` Postgres. Nothing changes for daily development.

---

## Quick checklist

- [ ] Neon project created; connection string copied
- [ ] Code pushed to GitHub
- [ ] Vercel project created from that repo
- [ ] `DATABASE_URL` (Neon), `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL` set in Vercel
- [ ] First deploy done
- [ ] `npx prisma migrate deploy` run with Neon `DATABASE_URL`
- [ ] (Optional) Seed run with Neon `DATABASE_URL`
- [ ] `NEXT_PUBLIC_APP_URL` updated to real Vercel URL and redeployed

---

## If something fails

- **Build fails on Vercel:** Check the build log. Often missing env var (e.g. `DATABASE_URL`) or a TypeScript/import error.
- **“Database connection failed” on the live site:** Confirm `DATABASE_URL` in Vercel is the Neon string with `?sslmode=require`, and that you ran `prisma migrate deploy` against that URL.
- **Login/register broken:** Ensure `JWT_SECRET` is set in Vercel and you redeployed after adding it.

Your local Docker and PowerShell setup is separate; only the **deployed** app uses Neon. You can keep developing locally as before.
