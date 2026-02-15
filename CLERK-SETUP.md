# Clerk auth setup

The app uses **Clerk** for sign-in and sign-up. No OTP or SMS needed for Clerk – users sign in with email/password or social (Google, etc.) and then complete onboarding with a sponsor code.

## 1. Create a Clerk application

1. Go to **https://dashboard.clerk.com** and sign in or create an account.
2. Create a new application (or use an existing one).
3. In **API Keys**, copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

## 2. Add keys in Vercel

In your project → **Settings** → **Environment Variables**, add:

- **Name:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  
  **Value:** your Clerk publishable key
- **Name:** `CLERK_SECRET_KEY`  
  **Value:** your Clerk secret key

Set both for **Production** (and **Preview** if you use preview deployments). Then **redeploy**.

## 3. Redirect URLs in Clerk

In the Clerk dashboard → **Paths** (or **Configure** → **Paths**):

- **Sign-in URL:** `/login`
- **Sign-up URL:** `/register`
- **After sign-in:** `/dashboard`
- **After sign-up:** `/onboarding`

In **Settings** → **Paths** (or **Domains**), add your production domain (e.g. `realtymaitra.propertywithmanish.com`) so redirects work in production.

## 4. Flow

- **Sign up:** User goes to `/register` → Clerk sign-up → redirect to `/onboarding` → they enter name + sponsor code (e.g. DEMO1234) → join.
- **Sign in:** User goes to `/login` → Clerk sign-in → redirect to `/dashboard`.
- **API:** Authenticated requests use the Clerk session cookie; the app also accepts the legacy Bearer JWT for existing users.

## 5. Database migration

The app adds a `clerkUserId` column to the `User` table. Run migrations (e.g. on Vercel build we run `prisma migrate deploy`, or run locally):

```bash
npx prisma migrate deploy
```

## 6. Local development

Create a `.env.local` (or use `.env`) with:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Run `npm run dev` and open `/login` or `/register`.
