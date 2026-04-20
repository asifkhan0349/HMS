# Stage 1: Build the React Application
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with FastAPI
FROM python:3.11-slim
WORKDIR /app

# Install runtime dependencies for psycopg2 and health checks
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend /app/backend
WORKDIR /app/backend

# Copy the built React app
COPY --from=frontend-builder /app/dist /app/dist

# Environment defaults
ENV ENV=production
ENV DEBUG_MODE=False
ENV PYTHONPATH=/app/backend
ENV PORT=8000

# Run as non-root for container security
RUN addgroup --system hms && adduser --system --ingroup hms hms
RUN chown -R hms:hms /app
USER hms

EXPOSE 8000

# Run with gunicorn for production reliability
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["gunicorn", "-w", "${WEB_CONCURRENCY:-4}", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000", "--forwarded-allow-ips", "*", "--access-logfile", "-", "--error-logfile", "-"]
