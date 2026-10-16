@echo off
title AlphaPulse Enterprise Treasury Portal
echo ========================================================
echo   STARTING ALPHAPULSE ENTERPRISE TREASURY SUITE
echo ========================================================

:: 1. Start Node.js Express REST API (Port 5050)
echo [1/2] Starting Backend REST API on Port 5050...
start "AlphaPulse Backend" /min cmd /c "cd /d \"%~dp0server\" && npm start"

:: Wait 2 seconds for backend to initialize
timeout /t 2 >nul

:: 2. Start React + Vite Client (Port 3000)
echo [2/2] Starting React Frontend on Port 3000...
start "AlphaPulse Frontend" /min cmd /c "cd /d \"%~dp0client\" && npm run dev"

:: Wait 3 seconds then open browser
timeout /t 3 >nul
start http://localhost:3000

echo ========================================================
echo   AlphaPulse is running live at http://localhost:3000
echo   Backend REST API active at http://127.0.0.1:5050
echo ========================================================
exit
