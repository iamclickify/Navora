@echo off
setlocal

echo ===================================================
echo             Navora Docker Orchestration           
echo ===================================================

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    echo After installing, start Docker Desktop and run this script again.
    pause
    exit /b 1
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo Please launch Docker Desktop and wait until it is running, then run this script again.
    pause
    exit /b 1
)

echo Starting Navora Frontend and Backend with Docker Compose...
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:8000
echo API Documentation at: http://localhost:8000/docs
echo ===================================================

docker compose up --build

pause
