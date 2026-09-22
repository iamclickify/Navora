FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (build-essential for C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install with binary wheels preference
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --prefer-binary --no-cache-dir -r backend/requirements.txt

# Copy backend code, data, and models
COPY backend/ ./backend/
COPY data/ ./data/

ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

# Health check to ensure API is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

CMD ["uvicorn", "backend.src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
