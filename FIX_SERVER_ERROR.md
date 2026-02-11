# 🔧 Fix Internal Server Error

## Most Common Cause: Database Connection

The "Internal Server Error" is usually caused by **database connection failure**.

## Quick Fix Steps

### Step 1: Check Database Connection
```powershell
# Test if database is accessible
npm run db:migrate
```

**If it fails:**
- Your `DATABASE_URL` in `.env` is incorrect or missing
- Database server is not running
- Database doesn't exist

### Step 2: Set Up Database

**Option A - Free Cloud Database (Easiest):**
1. Go to https://neon.tech
2. Sign up → Create project
3. Copy connection string
4. Update `.env`:
   ```env
   DATABASE_URL="your-neon-connection-string"
   ```

**Option B - Local PostgreSQL:**
1. Make sure PostgreSQL is running
2. Create database: `CREATE DATABASE realty_collective;`
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realty_collective?schema=public"
   ```

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

### Step 6: Restart Server
```powershell
# Stop server (Ctrl+C)
npm run dev
```

## Test Endpoints

### Health Check
Visit: **http://localhost:3000/api/health**

**Expected:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**If error:**
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "..."
}
```

### Auth Check
Visit: **http://localhost:3000/api/auth/me**

**If not logged in:** Should return 401 (expected)
**If error 500:** Database or Prisma issue

## Other Possible Causes

### 1. Missing Dependencies
```powershell
npm install
```

### 2. TypeScript Errors
Check terminal for TypeScript compilation errors

### 3. Environment Variables
Make sure `.env` file exists and has:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Debug Steps

1. **Check Terminal Logs**
   - Look at where `npm run dev` is running
   - Find the actual error message

2. **Check Browser Console**
   - Press F12
   - Look at Console tab
   - Look at Network tab for failed requests

3. **Test Individual Endpoints**
   - `/api/health` - Database connection
   - `/api/auth/me` - Auth system
   - `/api/test-db` - Database test

## Still Not Working?

**Share:**
1. Error message from terminal
2. Response from `/api/health`
3. Your `.env` file structure (hide passwords)

I can help fix it once I see the actual error!
