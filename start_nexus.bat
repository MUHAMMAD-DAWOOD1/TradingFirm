@echo off
title Nexus Capital AI Launcher
echo ====================================================
echo         STARTING NEXUS CAPITAL AI TERMINAL
echo ====================================================
echo.
echo [1/2] Starting Backend Server (FastAPI on port 8000)...
start cmd /k "cd /d G:\TradingFirm\backend && python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend App (Vite on port 5173)...
start cmd /k "cd /d G:\TradingFirm\frontend && npm run dev"

echo.
echo System started successfully!
echo Open your browser at: http://localhost:5173
echo ====================================================
pause

