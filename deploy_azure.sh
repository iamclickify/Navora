#!/bin/bash
set -e

echo "=========================================================="
echo "    Deploying Navora Backend on Azure Linux Server        "
echo "=========================================================="

APP_DIR=$(pwd)
APP_USER=$(whoami)

# 1. Ensure Swap Memory is active (prevents OOM crashes & thrashing on Azure B-series VMs)
SWAP_EXISTS=$(swapon --show | wc -l)
if [ "$SWAP_EXISTS" -le 1 ]; then
    echo "[1/6] Configuring 2GB swap space for VM stability..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
else
    echo "[1/6] Swap space already active."
fi

# 2. Update system & install prerequisites
echo "[2/6] Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv nginx certbot python3-certbot-nginx git curl build-essential

# 3. Setup passwordless sudo for systemctl (required for GitHub Actions CI/CD)
echo "[3/6] Configuring sudo permissions for CI/CD automation..."
sudo bash -c "echo '$APP_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart navora-backend, /bin/systemctl status navora-backend, /bin/systemctl is-active navora-backend' > /etc/sudoers.d/navora-cicd"
sudo chmod 0440 /etc/sudoers.d/navora-cicd

# 4. Setup Python virtual environment
echo "[4/6] Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install --prefer-binary -r backend/requirements.txt

# Save requirement hash for fast CI/CD builds
sha256sum backend/requirements.txt | cut -d ' ' -f 1 > venv/.requirements.sha256

# 5. Create systemd daemon service
# Note: Using --workers 1 to avoid running out of memory on 1-2GB Azure VMs
echo "[5/6] Configuring systemd background service (workers=1 for optimal memory usage)..."
sudo bash -c "cat > /etc/systemd/system/navora-backend.service <<EOF
[Unit]
Description=Navora Freight AI Backend Service
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/venv/bin/uvicorn backend.src.api.main:app --host 0.0.0.0 --port 8000 --workers 1
Restart=always
RestartSec=5
Environment=PYTHONPATH=$APP_DIR
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable navora-backend
sudo systemctl restart navora-backend

# 6. Verification
echo "[6/6] Verifying backend status..."
sleep 3
sudo systemctl status navora-backend --no-pager

echo ""
echo "=========================================================="
echo " Navora Backend is successfully running on 0.0.0.0:8000! "
echo "=========================================================="
