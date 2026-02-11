# 🎯 SIMPLE SETUP - For Beginners

## ⚡ EASIEST WAY (No Database Installation Needed!)

### Step 1: Get Free Database (2 minutes)
1. Open browser
2. Go to: **https://neon.tech**
3. Click "Sign Up" (it's free, no credit card needed)
4. Click "Create Project"
5. Name it: `realty-collective`
6. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)

### Step 2: Update .env File
1. Open the file: `realty-collective\.env` (in your project folder)
2. Find the line that says `DATABASE_URL=`
3. Replace everything after `=` with your connection string from Step 1
4. Save the file

### Step 3: Run These Commands (Copy & Paste One by One)

Open PowerShell in the `realty-collective` folder, then copy and paste these commands one by one:

```powershell
npm run db:generate
```

Wait for it to finish, then:

```powershell
npm run db:migrate
```

Wait for it to finish, then:

```powershell
npm run db:seed
```

Wait for it to finish, then:

```powershell
npm run dev
```

### Step 4: Open Browser
Go to: **http://localhost:3000**

### Step 5: Login
- Email: `admin@realtycollective.com`
- Password: `admin123`

**That's it! 🎉**

---

## 🆘 If You Get Errors

**Error: "Cannot connect to database"**
- Make sure you copied the ENTIRE connection string from Neon.tech
- Make sure there are no spaces in the .env file

**Error: "Module not found"**
- Run: `npm install`

**Error: "Port 3000 in use"**
- Close other programs using port 3000
- Or wait a minute and try again

---

## 📞 Need Help?

If something doesn't work, tell me:
1. What error message you see
2. Which step you're on

I'll help you fix it!
