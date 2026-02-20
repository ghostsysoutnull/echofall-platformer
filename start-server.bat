@echo off
setlocal

cd /d "%~dp0"

set PORT=%1
if "%PORT%"=="" set PORT=8081
set URL=http://localhost:%PORT%/game.html

echo Starting local server in "%CD%" on port %PORT%...
echo Opening %URL%
echo.

where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  npx --yes http-server -p %PORT% -c-1
  goto :eof
)

echo ERROR: Could not find npx on PATH.
echo Install Node.js (includes npx), then run this script again.
pause
exit /b 1
