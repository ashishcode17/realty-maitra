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

## 2. SMS – India (FREE with Fast2SMS)

**Fast2SMS** is India-based and gives **free ₹50 credit** after signup. Use it for Indian mobile numbers.

### Steps

1. Go to **https://www.fast2sms.com** and sign up.
2. After login, open **Dev API** in the menu (or **https://www.fast2sms.com/dashboard/dev-api**).
3. Copy your **API Key** (long string).
4. In **Vercel** → your project → **Settings** → **Environment Variables**, add:
   - **Name:** `FAST2SMS_API_KEY`  
   - **Value:** (paste your API key)
5. Redeploy. OTP will be sent to Indian numbers (e.g. 9876543210) via Fast2SMS.

No phone number to buy – only the API key. Indian users can enter 10-digit mobile; the app sends the same OTP to email and SMS.

### Phone OTP not working?

1. **Vercel env:** In Vercel → Project → **Settings** → **Environment Variables**, ensure `FAST2SMS_API_KEY` is set for **Production** (and **Preview** if you test preview URLs). No quotes; paste the key as-is.
2. **Redeploy:** After adding or changing the variable, trigger a new deploy (Deployments → ⋮ → Redeploy).
3. **Logs:** In Vercel → **Deployments** → open the latest deployment → **Functions** or **Logs**. Try sending OTP again and look for `[SMS]` lines. You’ll see either “Fast2SMS API error: …” or “FAST2SMS_API_KEY not set” — that tells you what’s wrong (no OTP is ever logged).
4. **Number:** Use a 10-digit Indian mobile (e.g. 9876543210). With or without +91 / 0 is fine.

---

## 3. SMS – International (optional, Twilio)

If you need OTP for **non-Indian** numbers (e.g. US, UK), use **Twilio** and set:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

Indian numbers use Fast2SMS first; Twilio is only needed for international.

---

## Summary

- **Email:** Set SMTP vars in Vercel → OTP by email.
- **SMS India (free):** Sign up at Fast2SMS → get API key → set `FAST2SMS_API_KEY` in Vercel → redeploy.
- **SMS International:** Optional; set Twilio vars if you need non-Indian OTP.
