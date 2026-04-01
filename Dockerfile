# Stage 1: Build the React Application
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Puppeteer skips download on frontend build
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend source code and build
COPY . .
RUN npm run build

# Stage 2: Build the FastAPI Backend Image
FROM python:3.11-slim AS backend
WORKDIR /app/backend

# Install necessary system dependencies for psycopg2 and other packages
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend /app/backend

# Copy the built React app from the previous stage into the '/app/dist' directory
COPY --from=frontend-builder /app/dist /app/dist

# Expose port 8000
EXPOSE 8000

# Set environment variables for the application to default to local sqlite inside container
ENV DATABASE_URL="sqlite:////app/backend/hms.db"

# Run FastAPI using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
