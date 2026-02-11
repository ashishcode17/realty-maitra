# 🚀 Quick Start Guide - Get Realty Maitra Running

## Step-by-Step Setup

### Option 1: Using Local PostgreSQL (Recommended)

#### 1. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- Install and remember your password
- Default port: 5432

#### 2. Create Database
Open PostgreSQL command line or pgAdmin and run:
```sql
CREATE DATABASE realty_collective;
```

#### 3. Create .env File
Create a `.env` file in the `realty-collective` folder with:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realty_collective?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Replace `YOUR_PASSWORD` with your PostgreSQL password!**

#### 4. Run Setup Commands
Open terminal in the `realty-collective` folder and run:

```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### 5. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser! 🎉

---

### Option 2: Using Free Cloud Database (Easier - No Local Install)

#### 1. Get Free PostgreSQL Database
- Go to: https://neon.tech (free tier available)
- Or: https://supabase.com (free tier available)
- Create account and database
- Copy the connection string

#### 2. Create .env File
Create `.env` in `realty-collective` folder:
```env
DATABASE_URL="your-cloud-database-connection-string-here"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 3. Run Setup Commands
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

#### 4. Start Server
```bash
npm run dev
```

---

## 🎯 Default Login Credentials

After seeding, you can login with:

**Admin Account:**
- Email: `admin@realtycollective.com`
- Password: `admin123`

**Director Account:**
- Email: `director@realtycollective.com`
- Password: `director123`

**VP Account:**
- Email: `vp@realtycollective.com`
- Password: `vp123`

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env is correct
- Check password is correct

### "Module not found" errors
- Run: `npm install`

### "Prisma Client not generated"
- Run: `npm run db:generate`

### Port 3000 already in use
- Change port: `npm run dev -- -p 3001`
- Or close the app using port 3000

---

## 📱 What to Try

1. **Homepage**: http://localhost:3000
2. **Register**: Use director's ID as sponsor code
3. **Login**: Use any of the seeded accounts
4. **Dashboard**: See your stats
5. **Network**: View your team tree
6. **Projects**: Browse available projects
7. **Training**: Access training materials
8. **Offers**: Take on challenges
9. **Admin**: Login as admin to see admin dashboard

---

## 🎨 Features to Test

- ✅ User registration with sponsor code
- ✅ Email OTP verification (works without email setup, just won't send emails)
- ✅ Login/Logout
- ✅ Network tree visualization
- ✅ Project browsing
- ✅ Training content access
- ✅ Challenge enrollment
- ✅ Admin dashboard

Enjoy! 🚀
