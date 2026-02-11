@echo off
echo ========================================
echo   COMPLETE FIX - PRISMA CLIENT
echo ========================================
echo.

echo Step 1: Regenerating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Generation failed
    pause
    exit /b 1
)
echo ✅ Prisma client generated

echo.
echo Step 2: Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cache cleared
)

echo.
echo Step 3: Fixing default.js files...
echo // Prisma Client > "node_modules\.prisma\client\default.js"
echo export * from './index'; >> "node_modules\.prisma\client\default.js"
echo export { PrismaClient } from './index'; >> "node_modules\.prisma\client\default.js"

echo // Prisma Client default > "node_modules\@prisma\client\default.js"
echo module.exports = require('.prisma/client/index'); > "node_modules\@prisma\client\default.js"
echo ✅ Files fixed

echo.
echo ========================================
echo   ✅ ALL FIXED!
echo ========================================
echo.
echo Now restart your app:
echo 1. Stop current app (Ctrl+C)
echo 2. Run: npm run dev
echo 3. Try login!
echo.
pause
