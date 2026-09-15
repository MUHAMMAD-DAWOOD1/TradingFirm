@echo off
echo ===================================================
echo Starting Nexus AI Trading Intelligence Platform
echo ===================================================

echo [1/2] Starting FastAPI Backend on port 8000...
start cmd /k "cd /d g:\TradingFirm && python -m uvicorn backend.server:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend on port 5173...
start cmd /k "cd /d g:\TradingFirm\frontend && npm run dev"

echo ===================================================
echo Platform launched!
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo ===================================================
pause
