@echo off
set "GIT_PATH=C:\Users\fexo4\AppData\Local\hermes\git\cmd\git.exe"

echo --- Setting Identity ---
"%GIT_PATH%" config --global user.email "fexo.4921@gmail.com"
"%GIT_PATH%" config --global user.name "fexo.4921"

echo --- Staging changes ---
"%GIT_PATH%" add .

echo --- Committing ---
"%GIT_PATH%" commit -m "update message"

echo --- Pushing to GitLab ---
"%GIT_PATH%" push origin main

echo.
echo ====================================
echo  Code successfully pushed to GitLab!
echo ====================================
pause