# Firebase Phone Auth Setup

The app uses **Firebase Phone Authentication** for OTP on register and login (no Fast2SMS or Twilio required for phone).

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Add a project (or use an existing one).
3. In **Build → Authentication**, click **Get started**.
4. Open **Sign-in method**, enable **Phone**, and save.

## 2. Get client config (for the browser)

1. In Firebase Console: **Project settings** (gear) → **General**.
2. Under **Your apps**, add a **Web** app if you don’t have one (e.g. nickname “Realty Maitra”).
3. Copy the `firebaseConfig` object and set these in `.env` and in **Vercel → Environment Variables**:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 3. Get service account key (for the server)

1. In Firebase Console: **Project settings** → **Service accounts**.
2. Click **Generate new private key**.
3. You get a JSON file. The backend needs this as a **single string** (no newlines).
4. In **Vercel** → your project → **Settings** → **Environment Variables**, add:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** Paste the entire JSON in one line (e.g. `{"type":"service_account",...}`).

For local `.env`, you can paste the same one-line JSON (no quotes around the whole thing, or use escaped quotes if your env format requires it).

## 4. Authorized domains (for production)

1. In **Authentication** → **Settings** → **Authorized domains**.
2. Add your production domain (e.g. `realtymaitra.propertywithmanish.com`) and `localhost` for dev.

## 5. Redeploy

After setting all variables in Vercel, trigger a new deploy. Register and login OTP will then use Firebase to send and verify the phone code.

## Summary

- **Client (browser):** `NEXT_PUBLIC_FIREBASE_*` from the web app config.
- **Server (API):** `FIREBASE_SERVICE_ACCOUNT_JSON` = full service account JSON as one line.
- **No phone numbers to add** – Firebase sends the OTP to the number the user enters.
