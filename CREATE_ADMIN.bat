@echo off
echo ========================================
echo   CREATE ADMIN USER
echo ========================================
echo.

echo This will create the admin user in your database.
echo.

pause

echo.
echo Creating admin user...
node create-admin.js

echo.
echo ========================================
echo.
echo If you see "Admin user created successfully!" above,
echo you can now login with:
echo Email: admin@realtycollective.com
echo Password: admin123
echo.
pause
