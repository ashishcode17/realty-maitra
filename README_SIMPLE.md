# 🎯 Simple Setup Guide

## The Problem
You're getting "Can't reach" error because the app needs a database.

## The Solution (2 Minutes)

### Step 1: Get Free Database
1. Open browser → Go to **https://neon.tech**
2. Sign up (free, no credit card)
3. Click "Create Project"
4. Name: `realty-collective`
5. **Copy the connection string** (looks like `postgresql://user:pass@host/dbname`)

### Step 2: Update .env File
1. Open `realty-collective\.env` file
2. Find: `DATABASE_URL="prisma+postgres://..."`
3. Replace everything inside quotes with your connection string from Step 1
4. Save

### Step 3: Run Setup
Open PowerShell in `realty-collective` folder, run:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### Step 4: Open Browser
Go to: **http://localhost:3000**

### Step 5: Login
- Email: `admin@realtycollective.com`
- Password: `admin123`

**That's it! 🎉**

---

## Need Help?

If you see an error:
1. Copy the error message
2. Tell me which step you're on
3. I'll help you fix it!
