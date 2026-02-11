@echo off
echo ========================================
echo   REALTY COLLECTIVE - AUTO SETUP
echo ========================================
echo.

echo Step 1: Installing packages...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Generating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo WARNING: Prisma generate failed - might need database setup
)

echo.
echo Step 3: Starting server...
echo.
echo ========================================
echo   Server starting on http://localhost:3000
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

pause
