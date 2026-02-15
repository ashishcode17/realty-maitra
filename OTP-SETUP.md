# OTP by Email + SMS

The app sends the **same OTP** to **email** and **phone**. You can use the code from either.

---

## 1. Email (SMTP)

Set in Vercel → Settings → Environment Variables:

- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = your Gmail
- `SMTP_PASS` = [Gmail App Password](https://support.google.com/accounts/answer/185833)
- `SMTP_FROM` = same as SMTP_USER

---

## 2. SMS – India (choose one or more)

When you set **2Factor**, the app uses it first for Indian numbers. Otherwise it tries Fast2SMS, then 2Factor, then Twilio.

### Option A: Fast2SMS

**Fast2SMS** is India-based. You do **not** add “numbers” anywhere – the API sends to whatever 10-digit Indian number the user enters. You only need the **API key** and (for the free OTP route) **wallet balance**.

### Right way to set up Fast2SMS

1. **Sign up** at **https://www.fast2sms.com** (name, email, mobile, etc.).
2. **Verify your mobile number** – Fast2SMS will send an OTP to your mobile; enter it. This is required.
3. **Verify your email** – click the link they send. This is required to get the free credit (₹50 or similar).
4. **Check your wallet** – After login, open **Wallet** or **Balance** in the dashboard. You must have some balance for the OTP route to work. Free credit usually appears after mobile + email verification.
5. **Get the API key** – In the menu, open **Dev API** (or go to **https://www.fast2sms.com/dashboard/dev-api**). Copy the **API Key** (long string). You do **not** need to add sender IDs or “numbers” here – just copy the key.
6. **Add key in Vercel** – In your project → **Settings** → **Environment Variables**, add:
   - **Name:** `FAST2SMS_API_KEY`
   - **Value:** (paste the API key, no quotes)
7. **Redeploy** so the new env is used.

You do **not** need to add or register any phone numbers on Fast2SMS. The app sends the OTP to the number the user types in the form (any valid 10-digit Indian number).

### If OTP still doesn’t send (phone)

1. **Vercel env:** Ensure `FAST2SMS_API_KEY` is set for **Production** (and **Preview** if you use it). Redeploy after changing.
2. **Vercel logs:** Deployments → latest → **Functions** or **Logs**. Send OTP again and look for lines starting with `[SMS]`. You’ll see the **exact Fast2SMS response**, e.g.:
   - `Insufficient wallet balance` → Add balance in Fast2SMS dashboard (Wallet).
   - `Invalid API key` or `Unauthorized` → Wrong key or copy-paste error; get the key again from Dev API.
   - `FAST2SMS_API_KEY not set` → Env var not set or not deployed.
3. **Fast2SMS wallet:** Log in to Fast2SMS and check **Wallet/Balance**. The free OTP route uses this balance; if it’s 0, top up or complete verification so free credit is added.
4. **Optional – Quick SMS route (₹5 per SMS):** If the normal OTP route keeps failing, you can use the “Quick SMS” route (no DLT, often more reliable). In Vercel env add:
   - **Name:** `FAST2SMS_USE_QUICK_SMS`
   - **Value:** `true`
   Then redeploy. Each OTP will cost ₹5 from your Fast2SMS wallet.

### Option B: 2Factor.in (often more reliable in India)

If you have 2Factor balance and set the key, the app uses **2Factor first** for Indian numbers.

1. Sign up at **https://2factor.in** and add SMS balance.
2. Get your **API key** from the dashboard (SMS / OTP section).
3. In Vercel → **Settings** → **Environment Variables**, add:
   - **Name (exactly):** `TWO_FACTOR_API_KEY`  
   - **Value:** your 2Factor API key (no quotes, no spaces)
   - **Environment:** Production (and Preview if you use it)
4. **Redeploy** (Deployments → ⋮ → Redeploy) so the new env is used.

**If SMS still doesn’t go (only email):**

- Confirm the variable name is **exactly** `TWO_FACTOR_API_KEY` (all caps, underscore).
- Redeploy after adding or changing the variable.
- After sending an OTP, open **Vercel** → your project → **Logs** (or **Deployments** → latest → **Functions**). Look for lines starting with `[SMS] 2Factor` – the next line shows the HTTP status and 2Factor’s response (e.g. Invalid API Key, Low Balance). That tells you what to fix.

### Option C: Twilio (works for India and international)

---

## 3. SMS – International (optional, Twilio)

If you need OTP for **non-Indian** numbers (e.g. US, UK), use **Twilio** and set:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

Indian numbers: app tries Fast2SMS → 2Factor.in → Twilio. Set any one (or more) in Vercel.

---

## Summary

- **Email:** Set SMTP vars in Vercel → OTP by email.
- **SMS India (free):** Sign up at Fast2SMS → get API key → set `FAST2SMS_API_KEY` in Vercel → redeploy.
- **SMS International:** Optional; set Twilio vars if you need non-Indian OTP.
