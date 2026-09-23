@echo off
setlocal

:: Ensure Docker binaries from standard installation paths and System32 are in PATH
set "PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin;%ProgramFiles%\Docker\Docker\resources\bin;C:\Program Files\Docker\Docker\resources\bin;%SystemRoot%\System32;%PATH%"

echo ===================================================
echo             Navora Docker Orchestration           
echo ===================================================

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH!
    echo If you just installed Docker Desktop, please restart your terminal or PC.
    echo Or install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo Please launch Docker Desktop and wait until it finishes starting, then run this script again.
    pause
    exit /b 1
)

echo Docker is detected and running!
echo Starting Navora Frontend and Backend with Docker Compose...
echo.
echo - Frontend Dashboard : http://localhost:5173
echo - Backend API        : http://localhost:8000
echo - Interactive Docs   : http://localhost:8000/docs
echo ===================================================
echo.

docker compose up --build

pause
