@echo off
cd /d "%~dp0"
echo ========================================
echo Deploying from: %CD%
echo ========================================
echo.

echo [1] Git status (what will be pushed):
git status
echo.

echo [2] Adding all files...
git add .
if errorlevel 1 (
  echo ERROR: git add failed
  pause
  exit /b 1
)

echo [3] Committing...
git commit -m "Update live app"
if errorlevel 1 (
  echo.
  echo NOTE: If you see "nothing to commit", your changes are already committed.
  echo Try: git push origin main
  echo.
)

echo [4] Pushing to GitHub (origin main)...
git push origin main
if errorlevel 1 (
  echo.
  echo ERROR: Push failed. Check:
  echo - Are you logged into GitHub?
  echo - Is the branch name correct? Run: git branch
  echo.
  pause
  exit /b 1
)

echo.
echo ========================================
echo Done. Check Vercel for new deployment.
echo ========================================
pause
