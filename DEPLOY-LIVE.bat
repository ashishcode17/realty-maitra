@echo off
cd /d "%~dp0"

echo ========================================
echo   DEPLOY TO GITHUB (then Vercel builds)
echo ========================================
echo.
echo Folder: %CD%
echo.

echo [1] Git remote (must match Vercel connected repo):
git remote -v
echo.
echo [2] Current branch (Vercel Production Branch should match):
git branch --show-current
echo.

echo [3] Pulling latest from GitHub...
git pull origin main 2>nul
if errorlevel 1 (
  echo Could not pull - maybe no remote. Continuing...
)
echo.

echo [4] Status (changed files):
git status --short
echo.

echo [5] Adding all files...
git add .
if errorlevel 1 (
  echo ERROR: git add failed
  pause
  exit /b 1
)

echo [6] Committing...
git commit -m "Update live app" 2>nul
if errorlevel 1 (
  echo No new changes to commit - will push any existing commits.
) else (
  echo Committed.
)
echo.

echo [7] Pushing to GitHub (origin main)...
git push origin main
if errorlevel 1 (
  echo.
  echo *** PUSH FAILED ***
  echo - Check: GitHub login (browser or credential manager)
  echo - Check: Branch name. Run in Cursor: git branch
  echo - If Vercel uses "main", push to: git push origin main
  echo.
  pause
  exit /b 1
)

echo.
echo ========================================
echo   DONE. GitHub updated.
echo   Vercel will auto-deploy in 1-2 min.
echo ========================================
pause
