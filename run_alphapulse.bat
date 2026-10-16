@echo off
title AlphaPulse Launcher
echo ========================================================
echo   STARTING ALPHAPULSE ENTERPRISE TREASURY SUITE
echo ========================================================

:: Change directory to server folder
cd /d "%~dp0server"

:: Kill any existing process holding port 5050
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5050') do (
    taskkill /F /PID %%a 2>nul
)

:: Start Node.js server in a dedicated window
echo Starting AlphaPulse backend and frontend server...
start "AlphaPulse Server (Port 5050)" cmd /k "node src/index.js"

:: Wait 2 seconds for server to be ready
timeout /t 2 >nul

:: Open browser directly
start http://localhost:5050

echo ========================================================
echo   AlphaPulse is running at: http://localhost:5050
echo   Close the server window to stop.
echo ========================================================
timeout /t 3 >nul
exit
