@echo off
echo ========================================
echo   CREATE ADMIN USER - SIMPLE WAY
echo ========================================
echo.

echo Step 1: Starting Prisma Studio...
echo.
echo This will open a website where you can add the admin user.
echo.
echo After it starts, you'll see: "Prisma Studio is up on http://localhost:5555"
echo.
echo Then:
echo   1. Open your browser
echo   2. Go to: http://localhost:5555
echo   3. Click on "User" table
echo   4. Click "Add record" button
echo   5. Fill in the form (see HOW_TO_CREATE_ADMIN.txt for details)
echo   6. Click "Save"
echo.
echo Press Ctrl+C to stop Prisma Studio when done.
echo.
pause

call npm run db:studio
