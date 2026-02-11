# 🔍 Login Error Debugging

## Common Causes & Fixes

### 1. Database Connection Error
**Symptom:** "An error occurred" or "Login failed"

**Check:**
- Is DATABASE_URL set in `.env`?
- Is database accessible?
- Run: `npm run db:migrate` to test connection

**Fix:**
```powershell
# Test database connection
npm run db:migrate

# If it fails, update DATABASE_URL in .env
```

### 2. No Users in Database
**Symptom:** "Invalid email or password" (even with correct credentials)

**Fix:**
```powershell
# Seed the database
npm run db:seed

# Then try login with:
# Email: admin@realtycollective.com
# Password: admin123
```

### 3. Prisma Client Not Generated
**Symptom:** Module errors

**Fix:**
```powershell
npm run db:generate
```

### 4. Check Browser Console
Open browser DevTools (F12) → Console tab
- Look for error messages
- Check Network tab for API response

### 5. Check Server Logs
Look at the terminal where `npm run dev` is running
- Look for error messages
- Check for database connection errors

---

## Quick Test

1. **Check if database has users:**
   ```powershell
   npm run db:studio
   # Opens Prisma Studio - check User table
   ```

2. **Try login with seeded account:**
   - Email: `admin@realtycollective.com`
   - Password: `admin123`

3. **Check .env file:**
   - DATABASE_URL should be set
   - JWT_SECRET should be set

---

## Still Not Working?

**Share:**
1. What error shows in browser console? (F12)
2. What error shows in terminal? (where npm run dev is running)
3. Did you run `npm run db:seed`?
4. What's your DATABASE_URL? (hide password)
