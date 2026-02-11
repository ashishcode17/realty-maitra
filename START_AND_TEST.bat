@echo off
echo ========================================
echo   START YOUR APP AND TEST LOGIN
echo ========================================
echo.

echo This will:
echo 1. Start your website
echo 2. You can then test login
echo.
echo IMPORTANT: Keep this window open!
echo.
echo After you see "Ready on http://localhost:3000"
echo 1. Open your browser
echo 2. Go to: http://localhost:3000
echo 3. Click "Login"
echo 4. Try: admin@realtycollective.com / admin123
echo.
echo Press any key to start...
pause >nul

call npm run dev
