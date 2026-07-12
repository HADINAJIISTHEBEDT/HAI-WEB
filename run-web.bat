@echo off
title HAI Run Web
cd /d "%~dp0"
echo ========================================
echo   HAI SOFTWARE INTELLIGENCE - RUN WEB
echo ========================================
echo.
echo Control panel: http://127.0.0.1:5501
echo Website:       http://localhost:5500
echo.
echo Keep this window open.
echo From Admin Settings you can choose Run Web / Stop Web.
echo.

where node >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:5500"
  node "%~dp0web-control.js"
  goto :eof
)

echo ERROR: Node.js is required for Run/Stop from Settings.
echo Install Node.js, or use Python fallback below.
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:5500"
  py -m http.server 5500
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:5500"
  python -m http.server 5500
  goto :eof
)

echo ERROR: Need Node.js or Python.
pause
