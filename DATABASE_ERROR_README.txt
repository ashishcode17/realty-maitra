================================================================================
  LOGIN SAYS "DATABASE ERROR" – QUICK FIX
================================================================================

Your app was working before; now login shows "Database query failed" or
"Database connection failed". That usually means the app cannot reach the
database server (Neon.tech).

--------------------------------------------------------------------------------
1. RUN THIS IN THE PROJECT FOLDER (PowerShell)
--------------------------------------------------------------------------------
  npm run test:db

If it prints: "Can't reach database server at ... neon.tech"
  → Your Neon database is likely PAUSED or your network is blocking it.

--------------------------------------------------------------------------------
2. RESUME THE DATABASE (most common fix)
--------------------------------------------------------------------------------
1. Open: https://console.neon.tech
2. Log in and open your project.
3. If you see "Paused" or "Restore" → click it and wait until it says "Active".
4. Try logging in again.

--------------------------------------------------------------------------------
3. STILL FAILING?
--------------------------------------------------------------------------------
- Use the "Direct" connection string from Neon (not Pooler) in .env as DATABASE_URL.
- Turn off VPN and try again.
- See CHECK_NEON_DATABASE.txt in this folder for full steps.

================================================================================
