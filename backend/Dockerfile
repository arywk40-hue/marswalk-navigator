# Marswalk Navigator - Containerized FastAPI Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy application files and data
COPY backend /app/backend
COPY web/public/data /app/web/public/data

ENV MARSWALK_DATA_DIR=/app/web/public/data
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}
