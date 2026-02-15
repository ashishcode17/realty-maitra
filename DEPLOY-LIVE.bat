@echo off
cd /d "%~dp0"
git add .
git commit -m "Update live app"
git push origin main
echo.
echo Done. Check Vercel dashboard for new deployment.
pause
