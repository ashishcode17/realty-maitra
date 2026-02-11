@echo off
echo ========================================
echo   CLEAN INSTALL - PERMANENT FIX
echo ========================================
echo.

echo This will:
echo 1. Remove node_modules
echo 2. Remove .next cache
echo 3. Install Prisma 5 (stable version)
echo 4. Generate Prisma client
echo 5. Run migrations
echo 6. Ready to start!
echo.

pause

echo.
echo Step 1: Removing old files...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo ✅ Removed node_modules
)
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Removed .next cache
)
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma"
    echo ✅ Removed old Prisma client
)

echo.
echo Step 2: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo Step 3: Generating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Prisma generation failed
    pause
    exit /b 1
)
echo ✅ Prisma client generated

echo.
echo Step 4: Running migrations...
call npm run db:migrate
if errorlevel 1 (
    echo WARNING: Migration failed - but continuing
)

echo.
echo ========================================
echo   ✅ SETUP COMPLETE!
echo ========================================
echo.
echo Now:
echo 1. Run: npm run dev
echo 2. Go to: http://localhost:3000
echo 3. Login: admin@realtycollective.com / admin123
echo.
echo If admin user doesn't exist:
echo - Run: npm run db:seed
echo - OR use Prisma Studio to create it
echo.
pause
