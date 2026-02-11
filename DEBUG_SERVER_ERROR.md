# 🔍 Debugging Internal Server Error

## Quick Checks

### 1. Check Server Logs
Look at the terminal where `npm run dev` is running. The error message will show there.

### 2. Test Database Connection
Visit: **http://localhost:3000/api/health**

**If you see:**
- ✅ `{"status":"ok","database":"connected"}` = Database is working
- ❌ `{"status":"error","database":"disconnected"}` = Database connection issue

### 3. Common Causes

#### A. Database Not Connected
**Symptom:** Error in `/api/auth/me` or other API routes

**Fix:**
1. Check `.env` file has `DATABASE_URL`
2. Test connection: `npm run db:migrate`
3. If fails, set up database (see URGENT_FIX.md)

#### B. Missing Dependencies
**Symptom:** Module not found errors

**Fix:**
```powershell
npm install
```

#### C. Prisma Client Not Generated
**Symptom:** Prisma errors

**Fix:**
```powershell
npm run db:generate
```

#### D. TypeScript Errors
**Symptom:** Build fails

**Fix:**
- Check terminal for TypeScript errors
- Fix any type mismatches

### 4. Check Browser Console
Open DevTools (F12) → Console tab
- Look for JavaScript errors
- Check Network tab for failed API calls

### 5. Check Network Tab
Open DevTools (F12) → Network tab
- Look for failed requests (red)
- Click on failed request to see error details

## Most Likely Issue

**Database connection** - The app is trying to connect to PostgreSQL but can't.

**Quick Test:**
```powershell
# Test database
npm run db:migrate

# If it fails, you need to set up DATABASE_URL in .env
```

## Share Error Details

**Please share:**
1. What page/action triggers the error?
2. Error message from terminal (where npm run dev is running)
3. Error from browser console (F12)
4. Response from `/api/health` endpoint

This will help me fix it quickly!
