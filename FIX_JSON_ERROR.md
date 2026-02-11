# 🔧 Fix: "Unexpected token '<'" JSON Error

## What This Error Means

The error **"Unexpected token '<', "<!DOCTYPE "... is not valid JSON"** means:
- The API is returning an **HTML error page** instead of JSON
- This usually happens when there's a **database connection error**
- Next.js shows an error page (HTML) instead of your API response

## ✅ What I Fixed

1. **Better error handling** - All errors now return JSON
2. **Database error detection** - Specific messages for DB issues
3. **Frontend error handling** - Better error messages in UI

## 🔍 Root Cause

Most likely: **Database not connected**

The API tries to query the database, fails, and Next.js shows an error page.

## 🎯 Quick Fix

### Step 1: Check Database Connection

Visit: **http://localhost:3000/api/test-db**

**If you see:**
- ✅ `{"success":true}` = Database is connected
- ❌ Error = Database not connected

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
1. Install PostgreSQL
2. Create database: `CREATE DATABASE realty_collective;`
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realty_collective?schema=public"
   ```

### Step 3: Run Setup

```powershell
cd C:\Users\Ashish\Desktop\realty-collective
npm run db:migrate
npm run db:seed
npm run dev
```

### Step 4: Try Login Again

- Email: `admin@realtycollective.com`
- Password: `admin123`

## 🐛 Still Getting Error?

1. **Check browser console (F12)** - Look for actual error
2. **Check server terminal** - Look for database errors
3. **Test database**: Visit `/api/test-db`
4. **Verify .env** - Make sure DATABASE_URL is set

## 📝 What Changed

- ✅ API now always returns JSON (never HTML)
- ✅ Better error messages for database issues
- ✅ Frontend handles non-JSON responses gracefully
- ✅ Specific error codes for debugging

The login should now show proper error messages instead of the JSON parse error!
