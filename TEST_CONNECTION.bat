@echo off
echo ========================================
echo   TESTING DATABASE CONNECTION
echo ========================================
echo.

echo Step 1: Checking .env file...
if not exist .env (
    echo ❌ .env file not found!
    echo.
    echo Create .env file with:
    echo DATABASE_URL="your-connection-string"
    pause
    exit /b 1
)
echo ✅ .env file exists
echo.

echo Step 2: Testing database connection...
echo.
call npm run db:migrate
if errorlevel 1 (
    echo.
    echo ❌ Connection failed!
    echo.
    echo Check:
    echo 1. DATABASE_URL in .env file
    echo 2. Connection string is correct
    echo 3. Database is accessible
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Database connection successful!
echo.
echo Your database is connected and ready!
echo.
pause
