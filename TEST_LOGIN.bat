@echo off
echo ========================================
echo   TESTING YOUR SETUP
echo ========================================
echo.

echo Step 1: Checking if admin user exists...
echo.
echo Starting Prisma Studio to check...
echo After it opens, go to http://localhost:5555
echo Click "User" table
echo See if you see admin@realtycollective.com
echo.
echo Press any key to start Prisma Studio...
pause >nul

start /B npm run db:studio
timeout /t 5 /nobreak >nul

echo.
echo Prisma Studio should be opening in your browser...
echo.
echo Check if you see the admin user in the User table.
echo.
echo If you see it, close Prisma Studio (Ctrl+C) and we'll test login.
echo.
pause
