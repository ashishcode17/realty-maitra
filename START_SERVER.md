# 🚀 How to Start the Server

## Quick Start

### Step 1: Install Missing Dependencies
```powershell
cd C:\Users\Ashish\Desktop\realty-collective
npm install
```

### Step 2: Set Up Database
You need a database connection. Get one from:
- **https://neon.tech** (free, recommended)
- Or use local PostgreSQL

Update `.env` file with your `DATABASE_URL`

### Step 3: Generate Prisma Client
```powershell
npm run db:generate
```

### Step 4: Run Migrations
```powershell
npm run db:migrate
```

### Step 5: Seed Database
```powershell
npm run db:seed
```

### Step 6: Start Server
```powershell
npm run dev
```

### Step 7: Open Browser
Go to: **http://localhost:3000**

---

## If "Site Can't Be Reached"

### Check 1: Is Server Running?
Look at the terminal where you ran `npm run dev`
- ✅ If you see "Ready on http://localhost:3000" = Server is running!
- ❌ If you see errors = Share the error message

### Check 2: Database Connection
The most common issue is database not connected.

**Test database:**
```powershell
npm run db:migrate
```

**If it fails:**
- Your `DATABASE_URL` in `.env` is wrong
- Database server is not running
- Database doesn't exist

### Check 3: Port 3000
If port 3000 is in use:
```powershell
# Use different port
npm run dev -- -p 3001
# Then open: http://localhost:3001
```

### Check 4: TypeScript Errors
If you see TypeScript errors:
- Share the error message
- I'll fix them

---

## Common Errors & Fixes

### Error: "Cannot find module"
**Fix:** `npm install`

### Error: "Prisma Client not generated"
**Fix:** `npm run db:generate`

### Error: "Database connection failed"
**Fix:** Check `DATABASE_URL` in `.env` file

### Error: "Port 3000 already in use"
**Fix:** Close other apps or use port 3001

---

## Still Not Working?

**Tell me:**
1. What error shows in terminal? (where `npm run dev` is running)
2. Did you set up database? (neon.tech or local)
3. What's your `DATABASE_URL`? (hide password)

I'll help fix it!
