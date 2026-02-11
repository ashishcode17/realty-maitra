@echo off
echo ========================================
echo   FIXING DATABASE CONNECTION
echo ========================================
echo.

echo Step 1: Generating Prisma Client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    echo.
    echo Make sure:
    echo 1. You have DATABASE_URL in .env file
    echo 2. The connection string is correct
    echo.
    pause
    exit /b 1
)
echo ✅ Prisma client generated
echo.

echo Step 2: Running database migrations...
echo This will create all the tables in your database.
echo.
call npm run db:migrate
if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo.
    echo Common issues:
    echo 1. Database connection string is wrong
    echo 2. Database doesn't exist
    echo 3. Network/firewall blocking connection
    echo.
    echo Check your DATABASE_URL in .env file
    echo Make sure it's a complete connection string from neon.tech
    echo.
    pause
    exit /b 1
)
echo ✅ Migrations completed
echo.

echo Step 3: Seeding database with sample data...
call npm run db:seed
if errorlevel 1 (
    echo WARNING: Seeding failed, but that's okay
    echo You can seed later
)
echo.

echo ========================================
echo   ✅ DATABASE SETUP COMPLETE!
echo ========================================
echo.
echo Now try:
echo 1. Run START.bat
echo 2. Go to http://localhost:3000
echo 3. Login with: admin@realtycollective.com / admin123
echo.
pause
