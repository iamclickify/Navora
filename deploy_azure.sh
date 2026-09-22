#!/bin/bash
set -e

echo "=========================================================="
echo "    Deploying Navora Backend on Azure Linux Server        "
echo "=========================================================="

# 1. Update system & install prerequisites
echo "[1/4] Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv nginx certbot python3-certbot-nginx git curl build-essential

# 2. Setup Python virtual environment
echo "[2/4] Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install --prefer-binary --no-cache-dir -r backend/requirements.txt

# 3. Create systemd daemon service
echo "[3/4] Configuring systemd background service..."
APP_DIR=$(pwd)
APP_USER=$(whoami)

sudo bash -c "cat > /etc/systemd/system/navora-backend.service <<EOF
[Unit]
Description=Navora Freight AI Backend Service
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/venv/bin/uvicorn backend.src.api.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
Environment=PYTHONPATH=$APP_DIR

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable navora-backend
sudo systemctl restart navora-backend

# 4. Verification
echo "[4/4] Verifying backend status..."
sleep 2
sudo systemctl status navora-backend --no-pager

echo ""
echo "=========================================================="
echo " Navora Backend is successfully running on 127.0.0.1:8000! "
echo " Next step: Configure Nginx reverse proxy & SSL for Vercel."
echo "=========================================================="
