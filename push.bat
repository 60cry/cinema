@echo off
set "GIT_PATH=C:\Users\fexo4\AppData\Local\hermes\git\cmd\git.exe"
set "GITHUB_REPO=https://github.com/ahmad02001293-cloud/cinema.git"

echo --- Setting Identity ---
"%GIT_PATH%" config --global user.email "fexo.4921@gmail.com"
"%GIT_PATH%" config --global user.name "fexo.4921"

echo --- Setting GitHub remote ---
"%GIT_PATH%" remote set-url origin "%GITHUB_REPO%" 2>nul || "%GIT_PATH%" remote add origin "%GITHUB_REPO%"

echo --- Staging changes ---
"%GIT_PATH%" add .

echo --- Committing ---
"%GIT_PATH%" commit -m "update message"

echo --- Pushing to GitHub ---
"%GIT_PATH%" push -u origin main

echo.
echo ====================================
echo  Code successfully pushed to GitHub!
echo ====================================
pause