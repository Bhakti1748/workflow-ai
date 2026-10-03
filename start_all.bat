@echo off
echo ====================================================
echo   Launching WorkFlow AI Full Stack Application
echo ====================================================

start "WorkFlow AI - Backend (Port 8000)" cmd /k "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "WorkFlow AI - Frontend (Port 5173)" cmd /k "%~dp0start_frontend.bat"

echo.
echo WorkFlow AI is launching!
echo Backend:  http://localhost:8000 (API & Swagger Docs at /docs)
echo Frontend: http://localhost:5173
echo.
