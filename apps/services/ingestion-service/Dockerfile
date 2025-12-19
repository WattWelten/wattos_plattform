# Multi-Stage Build für Ingestion Service (Python FastAPI)
FROM python:3.11-slim AS base

WORKDIR /app

# Dependencies Stage
FROM base AS dependencies

COPY apps/services/ingestion-service/requirements.txt ./

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Build Stage
FROM base AS build

COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Production Stage
FROM python:3.11-slim AS production

WORKDIR /app

# Kopiere nur Runtime Dependencies
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Kopiere Application Code
COPY apps/services/ingestion-service/ ./

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')"

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]











