# ⚡ QUICK START - Get Running in 5 Minutes!

## 🎯 Fastest Way (Using Free Cloud Database)

### Step 1: Get Free Database (2 minutes)
1. Go to **https://neon.tech** (or supabase.com)
2. Sign up (free)
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)

### Step 2: Setup Environment (1 minute)
Open `.env` file and add:
```env
DATABASE_URL="paste-your-connection-string-here"
JWT_SECRET="any-random-secret-key-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Run Commands (2 minutes)
Open PowerShell in the `realty-collective` folder:

```powershell
# Navigate to project
cd C:\Users\Ashish\Desktop\realty-collective

# Generate database client
npm run db:generate

# Create tables
npm run db:migrate

# Add sample data
npm run db:seed

# Start the app!
npm run dev
```

### Step 4: Open Browser
Go to: **http://localhost:3000**

### Step 5: Login
- Email: `admin@realtycollective.com`
- Password: `admin123`

**That's it! You're running! 🎉**

---

## 🔧 If You Have PostgreSQL Installed Locally

### Step 1: Create Database
```sql
CREATE DATABASE realty_collective;
```

### Step 2: Update .env
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/realty_collective?schema=public"
JWT_SECRET="any-random-secret-key-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Run Setup
```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

---

## 🆘 Need Help?

**Database connection error?**
- Check your DATABASE_URL in .env
- Make sure database exists
- Verify password is correct

**Port 3000 in use?**
- Close other apps using port 3000
- Or run: `npm run dev -- -p 3001`

**Module errors?**
- Run: `npm install`

---

## 🎮 What to Try After Login

1. **Dashboard** - See your stats
2. **My Network** - View team tree
3. **Projects** - Browse real estate projects
4. **Training** - Access training materials
5. **Offers** - Take challenges
6. **Admin** - Full admin access (if logged in as admin)

**Happy coding! 🚀**
