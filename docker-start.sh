#!/usr/bin/env bash
set -e

echo "==================================================="
echo "            Navora Docker Orchestration            "
echo "==================================================="

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH!"
    echo "Please install Docker Desktop or Docker Engine from: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "[ERROR] Docker daemon is not running!"
    echo "Please launch Docker Desktop or start the docker service ('sudo systemctl start docker')."
    exit 1
fi

echo "Starting Navora Frontend and Backend with Docker Compose..."
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API will be available at: http://localhost:8000"
echo "API Documentation at: http://localhost:8000/docs"
echo "==================================================="

docker compose up --build
