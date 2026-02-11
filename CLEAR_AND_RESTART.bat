@echo off
echo ========================================
echo   CLEAR CACHE AND RESTART
echo ========================================
echo.

echo Step 1: Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Cleared .next cache
) else (
    echo ✅ No cache to clear
)

echo.
echo Step 2: Starting app...
echo.
echo IMPORTANT: Keep this window open!
echo.
echo After you see "Ready on http://localhost:3000"
echo Go to: http://localhost:3000 and try login
echo.
pause

call npm run dev
