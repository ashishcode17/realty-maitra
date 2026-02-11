@echo off
echo ========================================
echo   FIXING PRISMA CLIENT
echo ========================================
echo.

echo Step 1: Removing old Prisma client...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma"
    echo ✅ Removed old client
)

echo.
echo Step 2: Regenerating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    echo.
    echo Try running: npm install
    pause
    exit /b 1
)
echo ✅ Prisma client generated
echo.

echo Step 3: Testing connection...
node test-connection.js
if errorlevel 1 (
    echo.
    echo Connection test failed - but Prisma client is fixed!
    echo You can now try running: npm run db:migrate
    pause
    exit /b 0
)

echo.
echo ========================================
echo.
pause
