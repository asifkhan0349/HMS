#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
python -m alembic upgrade head

# Start the application
echo "Starting application..."
# WEB_CONCURRENCY defaults to 4 if not set. 
# We use exec to ensure signals are passed to gunicorn.
exec gunicorn -w ${WEB_CONCURRENCY:-1} -k uvicorn.workers.UvicornWorker app.main:app \
    --bind 0.0.0.0:8000 \
    --forwarded-allow-ips "*" \
    --access-logfile - \
    --error-logfile -
