@echo off
echo ========================================
echo   RESTART YOUR APP
========================================
echo.

echo This will:
echo 1. Stop any running app
echo 2. Start it fresh
echo.
echo IMPORTANT: Keep this window open!
echo.
echo After you see "Ready on http://localhost:3000"
echo Go to: http://localhost:3000
echo.
echo Press any key to start...
pause >nul

echo.
echo Starting app...
echo.

call npm run dev
