@echo off
title HAI Stop Web
cd /d "%~dp0"
echo Stopping HAI website...

where node >nul 2>nul
if %errorlevel%==0 (
  node -e "fetch('http://127.0.0.1:5501/stop').then(r=>r.json()).then(j=>console.log(j.message||'Stopped')).catch(()=>console.log('Control not running, killing port 5500...'))"
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5500" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5501" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>nul
)

echo Done.
pause
