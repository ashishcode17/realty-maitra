# 🚀 Get Started - Fix "Site Can't Be Reached"

## The Problem
"The site can't be reached" means the server isn't running or has errors.

## Quick Fix (3 Steps)

### Step 1: Update Database Schema
```powershell
cd C:\Users\Ashish\Desktop\realty-collective
npm run db:migrate
```

**If this fails:**
- Your `DATABASE_URL` in `.env` is wrong
- Get a free database from https://neon.tech
- Update `.env` with the connection string

### Step 2: Seed Database
```powershell
npm run db:seed
```

This creates:
- Admin user: `admin@realtycollective.com` / `admin123`
- Director user: `director@realtycollective.com` / `director123`
- Sample projects, training, challenges

### Step 3: Start Server
```powershell
npm run dev
```

**Look for:** "Ready on http://localhost:3000"

### Step 4: Open Browser
Go to: **http://localhost:3000**

---

## If You See Errors

### Error: "Cannot connect to database"
**Fix:** 
1. Get free database: https://neon.tech
2. Copy connection string
3. Update `.env` file: `DATABASE_URL="your-connection-string"`

### Error: "Prisma Client not generated"
**Fix:** `npm run db:generate`

### Error: TypeScript errors
**Fix:** Share the error message, I'll fix it

### Error: "Port 3000 in use"
**Fix:** 
```powershell
npm run dev -- -p 3001
# Then open: http://localhost:3001
```

---

## Test It Works

1. **Homepage:** http://localhost:3000
2. **Login:** Use `admin@realtycollective.com` / `admin123`
3. **Dashboard:** Should show stats and sidebar

---

## Still Not Working?

**Share:**
1. What error shows in terminal? (where `npm run dev` is running)
2. Did `npm run db:migrate` work?
3. What's your DATABASE_URL? (hide password)

I'll help fix it!
