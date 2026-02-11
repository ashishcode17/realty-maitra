@echo off
echo ========================================
echo   QUICK RESTART
echo ========================================
echo.

echo Step 1: Clearing cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cache cleared
)

echo.
echo Step 2: Starting app...
echo.
echo Keep this window open!
echo After "Ready on http://localhost:3000", try login.
echo.
pause

call npm run dev
