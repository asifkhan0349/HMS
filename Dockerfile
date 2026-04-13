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

EXPOSE 8000

# Run with uvicorn (standard workers for production)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
