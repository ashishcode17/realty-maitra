# 🚀 START HERE - Get Realty Maitra Running!

## ⚡ Quick Setup (Choose One Method)

---

## Method 1: Free Cloud Database (EASIEST - Recommended)

### 1️⃣ Get Free Database (2 min)
- Visit: **https://neon.tech** or **https://supabase.com**
- Sign up (free tier)
- Create new project → Copy connection string

### 2️⃣ Configure .env File
Open `.env` in the project folder and add:

```env
DATABASE_URL="your-connection-string-from-neon-or-supabase"
JWT_SECRET="my-secret-key-12345-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3️⃣ Run These Commands
Open PowerShell in `realty-collective` folder:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### 4️⃣ Open Browser
Go to: **http://localhost:3000**

### 5️⃣ Login
- **Email**: `admin@realtycollective.com`
- **Password**: `admin123`

**Done! 🎉**

---

## Method 2: Local PostgreSQL

### 1️⃣ Install PostgreSQL
- Download: https://www.postgresql.org/download/windows/
- Install (remember your password)

### 2️⃣ Create Database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE realty_collective;
```

### 3️⃣ Configure .env
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realty_collective?schema=public"
JWT_SECRET="my-secret-key-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4️⃣ Run Commands
```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

---

## 🎯 What You'll See

1. **Homepage** - Professional landing page
2. **Login** - Use admin credentials above
3. **Dashboard** - Stats and quick actions
4. **My Network** - Team tree visualization
5. **Projects** - Browse real estate projects
6. **Training** - Access training materials
7. **Offers** - Take challenges
8. **Admin** - Full admin panel (admin login only)

---

## 🐛 Common Issues

**"Cannot connect to database"**
- Check DATABASE_URL in .env
- Verify database exists
- Check password/credentials

**"Module not found"**
- Run: `npm install`

**"Port 3000 in use"**
- Close other apps
- Or: `npm run dev -- -p 3001`

---

## 📝 Default Accounts

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@realtycollective.com | admin123 |
| Director | director@realtycollective.com | director123 |
| VP | vp@realtycollective.com | vp123 |

---

## 🎮 Try These Features

- ✅ Register new user (use director's ID as sponsor code)
- ✅ View network tree
- ✅ Browse projects
- ✅ Book training sessions
- ✅ Enroll in challenges
- ✅ View earnings (admin can add test earnings)

**Ready? Let's go! 🚀**
