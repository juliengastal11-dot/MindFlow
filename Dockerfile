# MindFlow Business — image unique : le backend FastAPI sert aussi le front buildé.
# Build : docker build -t mindflow .
# Run   : docker run -p 8000:8000 -v mindflow-data:/app/backend/data -e SECRET_KEY=... mindflow

# ---- Étape 1 : build du front (Vite) --------------------------------------
FROM node:22-alpine AS front
WORKDIR /front
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Étape 2 : backend Python + front buildé -------------------------------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONUTF8=1 \
    FRONTEND_DIST=/app/frontend/dist \
    PORT=8000

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=front /front/dist /app/frontend/dist

# Données persistantes (base SQLite, clé secrète générée) : monter un volume ici
RUN mkdir -p /app/backend/data
VOLUME ["/app/backend/data"]

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/api/health' % os.environ.get('PORT', '8000'))" || exit 1

# --proxy-headers : derrière Caddy / Railway / Render, respecte X-Forwarded-Proto (https)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
