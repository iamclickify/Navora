@echo off
echo Starting Navora Backend...
start cmd /k "cd /d %~dp0 && python -m uvicorn backend.src.api.main:app --port 8000"

echo Starting Navora Frontend...
start cmd /k "cd /d %~dp0\frontend && npm run dev"

echo Both services started in separate windows!
