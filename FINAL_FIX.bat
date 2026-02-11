@echo off
echo ========================================
echo   FINAL FIX - PRISMA CLIENT
echo ========================================
echo.

echo This will:
echo 1. Clear Next.js cache
echo 2. Regenerate Prisma client
echo 3. Fix default.js file
echo 4. Ready to restart app
echo.

pause

echo.
echo Step 1: Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cleared
) else (
    echo ✅ Already clear
)

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
echo Step 3: Fixing default.js...
echo // Prisma Client for Next.js > "node_modules\.prisma\client\default.js"
echo module.exports = require('./client.ts'); >> "node_modules\.prisma\client\default.js"
echo ✅ Fixed

echo.
echo ========================================
echo   ✅ ALL FIXED!
echo ========================================
echo.
echo Now:
echo 1. Stop your app (Ctrl+C)
echo 2. Start again: npm run dev
echo 3. Try login!
echo.
pause
