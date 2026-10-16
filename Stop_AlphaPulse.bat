@echo off
title Stop AlphaPulse Server
echo Stopping AlphaPulse server on port 5050...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5050') do (
    taskkill /F /PID %%a 2>nul
)

echo AlphaPulse stopped.
timeout /t 2 >nul
exit
