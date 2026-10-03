@echo off
echo ==============================================
echo   Starting WorkFlow AI FastAPI Backend Server
echo ==============================================

cd /d "%~dp0"
call backend\venv\Scripts\activate.bat
set PYTHONPATH=.
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
