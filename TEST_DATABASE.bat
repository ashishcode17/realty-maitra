@echo off
echo ========================================
echo   TESTING DATABASE CONNECTION
echo ========================================
echo.

echo Step 1: Checking .env file...
if not exist .env (
    echo ERROR: .env file not found!
    pause
    exit /b 1
)
echo ✅ .env file exists
echo.

echo Step 2: Testing database connection...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✅ Prisma client generated
echo.

echo Step 3: Testing connection...
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => { console.log('✅ Database connection successful!'); process.exit(0); }).catch((e) => { console.error('❌ Database connection failed:', e.message); process.exit(1); });"
if errorlevel 1 (
    echo.
    echo ========================================
    echo   DATABASE CONNECTION FAILED
    echo ========================================
    echo.
    echo Common issues:
    echo 1. DATABASE_URL in .env is wrong
    echo 2. Database server is not accessible
    echo 3. Connection string format is incorrect
    echo.
    echo Check your .env file and make sure:
    echo - DATABASE_URL starts with "postgresql://"
    echo - The URL is complete (not cut off)
    echo - No extra quotes or spaces
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ DATABASE CONNECTION SUCCESSFUL!
echo ========================================
echo.
pause
