@echo off
echo ========================================
echo   DATABASE SETUP
echo ========================================
echo.
echo This will set up your database.
echo.
echo IMPORTANT: You need a DATABASE_URL first!
echo.
echo Get a FREE database from: https://neon.tech
echo.
echo After you get the connection string:
echo 1. Open .env file
echo 2. Add: DATABASE_URL="your-connection-string-here"
echo 3. Save the file
echo 4. Run this script again
echo.
pause

echo.
echo Step 1: Creating database tables...
call npm run db:migrate
if errorlevel 1 (
    echo.
    echo ERROR: Database migration failed!
    echo.
    echo Make sure:
    echo 1. You have DATABASE_URL in .env file
    echo 2. The connection string is correct
    echo 3. Your database is accessible
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Adding sample data...
call npm run db:seed
if errorlevel 1 (
    echo WARNING: Seeding failed, but that's okay
)

echo.
echo ========================================
echo   Database setup complete!
echo ========================================
echo.
pause
