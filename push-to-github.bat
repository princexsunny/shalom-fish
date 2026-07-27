@echo off
REM ============================================================
REM  Shalom Fish - push code to GitHub (safe: skips .env & node_modules)
REM  Double-click this file, or run it from a terminal in the project folder.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo [X] Git is not installed. Install it from https://git-scm.com/download/win then re-run.
  pause
  exit /b 1
)

REM --- first-time init ---
if not exist ".git" (
  echo First time setup...
  git init
  git branch -M main
)

REM --- make sure a remote is set (kept OUT of an if-block so the URL expands) ---
git remote get-url origin >nul 2>nul
if not errorlevel 1 goto have_remote
set /p REPOURL="Paste your GitHub repo URL (e.g. https://github.com/you/shalom-fish.git): "
if "!REPOURL!"=="" (
  echo [X] No URL entered. Create an empty repo at https://github.com/new first, then re-run.
  pause
  exit /b 1
)
git remote add origin "!REPOURL!"
:have_remote

REM --- commit message ---
set /p MSG="Commit message (press Enter for 'update site'): "
if "!MSG!"=="" set MSG=update site

echo.
echo Uploading to GitHub...
git add .
git commit -m "!MSG!"
git push -u origin main

echo.
if errorlevel 1 (
  echo [!] Push finished with an error above.
  echo     - If it says 'rejected'  : run  git pull --rebase origin main   then re-run this script.
  echo     - If it asks for login   : sign in to GitHub in the popup, or use a Personal Access Token as the password.
) else (
  echo [OK] Done! Code is on GitHub. Render will auto-deploy in ~2 minutes.
)
echo.
pause
