# 🔧 TROUBLESHOOTING - Localhost Not Working

## Quick Diagnosis

### Step 1: Check if Server is Running
Open PowerShell and run:
```powershell
cd C:\Users\Ashish\Desktop\realty-collective
npm run dev
```

**What to look for:**
- ✅ "Ready on http://localhost:3000" = Server is running!
- ❌ Error messages = See below

---

## Common Issues & Fixes

### ❌ Issue 1: "Cannot find module '@prisma/client'"
**Fix:**
```powershell
npm run db:generate
npm install
```

### ❌ Issue 2: "Error: P1001: Can't reach database server"
**Problem:** Database not configured or not running

**Fix Option A - Use Free Cloud Database:**
1. Go to https://neon.tech
2. Sign up (free)
3. Create project
4. Copy connection string
5. Update `.env`:
```env
DATABASE_URL="your-neon-connection-string-here"
JWT_SECRET="any-secret-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Fix Option B - Use Local PostgreSQL:**
1. Make sure PostgreSQL is installed and running
2. Create database: `CREATE DATABASE realty_collective;`
3. Update `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realty_collective?schema=public"
JWT_SECRET="any-secret-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### ❌ Issue 3: "Port 3000 is already in use"
**Fix:**
```powershell
# Option 1: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Option 2: Use different port
npm run dev -- -p 3001
# Then open: http://localhost:3001
```

### ❌ Issue 4: "Error: Environment variable not found: DATABASE_URL"
**Fix:**
1. Create/update `.env` file in `realty-collective` folder
2. Add:
```env
DATABASE_URL="your-database-url"
JWT_SECRET="secret-key-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### ❌ Issue 5: "Prisma schema not found" or migration errors
**Fix:**
```powershell
npm run db:generate
npm run db:migrate
```

### ❌ Issue 6: Browser shows "This site can't be reached"
**Check:**
1. Is the dev server running? (Look for "Ready" message)
2. Try: http://127.0.0.1:3000 instead
3. Check Windows Firewall isn't blocking it

---

## Complete Setup Checklist

Run these commands in order:

```powershell
cd C:\Users\Ashish\Desktop\realty-collective

# 1. Make sure .env exists with DATABASE_URL
# (Edit .env file manually)

# 2. Generate Prisma client
npm run db:generate

# 3. Create database tables
npm run db:migrate

# 4. Add sample data
npm run db:seed

# 5. Start server
npm run dev
```

---

## Still Not Working?

### Check These:
1. ✅ Node.js installed? (`node --version`)
2. ✅ Dependencies installed? (`npm install`)
3. ✅ .env file exists and has DATABASE_URL?
4. ✅ Database is accessible?
5. ✅ No port conflicts?

### Get More Info:
```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Check if port 3000 is in use
netstat -ano | findstr :3000

# See full error
npm run dev
```

---

## Quick Test Without Database

If you just want to see the UI (without database):
1. Comment out database calls temporarily
2. Or use a simple SQLite for testing

But **recommended**: Set up proper database (neon.tech is easiest!)

---

## Need Help?

Share the exact error message you see when running `npm run dev`!
