@echo off
echo.
echo ===================================
echo   Cinema Alrab - Auto Git Push
echo ===================================
echo.

set /p msg=Enter commit message (or press Enter for default): 

if "%msg%"=="" set msg=update: auto push

echo.
echo [1/3] Staging all changes...
git add -A

echo [2/3] Committing...
git commit -m "%msg%"

echo [3/3] Pushing to origin/main...
git push origin main

echo.
echo ===================================
echo   Done! Check Vercel for deploy.
echo ===================================
echo.
pause