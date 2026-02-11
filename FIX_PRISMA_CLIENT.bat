@echo off
echo ========================================
echo   FIXING PRISMA CLIENT FOR NEXT.JS
echo ========================================
echo.

echo Step 1: Removing broken files...
if exist "node_modules\.prisma\client\default.js" (
    del "node_modules\.prisma\client\default.js"
    echo ✅ Removed broken default.js
)

echo.
echo Step 2: Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cleared .next cache
)

echo.
echo Step 3: Regenerating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✅ Prisma client generated

echo.
echo Step 4: Creating Next.js compatible default.js...
echo // Prisma Client default export > "node_modules\.prisma\client\default.js"
echo export * from './index'; >> "node_modules\.prisma\client\default.js"
echo export { PrismaClient } from './index'; >> "node_modules\.prisma\client\default.js"
echo ✅ Created default.js

echo.
echo ========================================
echo   ✅ FIX COMPLETE!
echo ========================================
echo.
echo Now:
echo 1. Stop your app (Ctrl+C)
echo 2. Start again: npm run dev
echo 3. Try login
echo.
pause
