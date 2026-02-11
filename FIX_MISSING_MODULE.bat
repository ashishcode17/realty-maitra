@echo off
echo ========================================
echo   FIXING MISSING @PRISMA/CLIENT
echo ========================================
echo.

echo Step 1: Installing @prisma/client...
call npm install @prisma/client
if errorlevel 1 (
    echo ERROR: Installation failed
    pause
    exit /b 1
)
echo ✅ Installed

echo.
echo Step 2: Regenerating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Generation failed
    pause
    exit /b 1
)
echo ✅ Generated

echo.
echo Step 3: Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cache cleared
)

echo.
echo ========================================
echo   ✅ FIXED!
echo ========================================
echo.
echo Now restart your app:
echo 1. Stop app (Ctrl+C)
echo 2. Run: npm run dev
echo 3. Try login!
echo.
pause
