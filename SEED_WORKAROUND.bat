@echo off
echo ========================================
echo   MANUAL SEED WORKAROUND
echo ========================================
echo.

echo The automated seed has Prisma 7 compatibility issues.
echo.
echo OPTION 1: Use Prisma Studio (Recommended)
echo.
echo 1. Run: npm run db:studio
echo 2. This opens a web interface
echo 3. Click "User" table
echo 4. Add a new user manually
echo.
echo OPTION 2: Register via Website
echo.
echo 1. Start app: npm run dev
echo 2. Go to: http://localhost:3000/register
echo 3. Register with any email
echo 4. Then update role in database to ADMIN
echo.
echo OPTION 3: SQL (Advanced)
echo.
echo See MANUAL_SEED.md for SQL commands
echo.
pause
