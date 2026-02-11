@echo off
echo ========================================
echo   TESTING DATABASE CONNECTION
echo ========================================
echo.

echo Step 1: Regenerating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✅ Prisma client generated
echo.

echo Step 2: Testing if database tables exist...
echo.
echo If you see "Users: 0" or a number, database is connected!
echo If you see an error, the connection failed.
echo.

node -e "const {PrismaClient} = require('@prisma/client'); require('dotenv').config(); const p = new PrismaClient(); p.$connect().then(() => p.user.count()).then(c => {console.log('✅ Connected! Users:', c); p.$disconnect();}).catch(e => {console.error('❌ Error:', e.message); if(e.code) console.error('Code:', e.code); p.$disconnect().catch(()=>{}); process.exit(1);});"

echo.
echo ========================================
echo.
pause
