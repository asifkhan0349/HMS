# Hospital Management System

This project now includes:

- a React + Vite frontend
- a FastAPI backend
- a SQLite database for local persistence

## Project structure

- `src/`: frontend source
- `backend/app/`: FastAPI application code
- `backend/hms.db`: SQLite database
- `src/lib/api.js`: reusable frontend API client
- `docs/backend-integration.md`: backend structure and frontend connection guide

## Run the frontend

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://127.0.0.1:5173`.

## Run the backend

1. Create or activate a Python virtual environment.
2. Install backend packages:

```bash
pip install -r backend/requirements.txt
```

3. Start the API server from the project root:

```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

4. Open:

- API root: `http://127.0.0.1:8000/`
- Health check: `http://127.0.0.1:8000/api/health`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Frontend to backend connection

During local development, Vite now proxies `/api/*` requests to `http://127.0.0.1:8000`, so the frontend can call routes like:

```js
fetch('/api/patients')
```

Auth routes are also available:

- `POST /api/auth/signup`
- `POST /api/auth/login`

For deployment, set `VITE_API_URL` to your hosted backend URL.

## CRUD resources

The backend provides CRUD APIs for:
- patients, appointments, medical records, invoices, medicines, lab tests, staff, beds, and blood inventory.

## Production Ready Features

This application is configured for production with:
- **Gunicorn + Uvicorn**: High-performance process management.
- **Docker**: Simple containerized deployment.
- **Health Checks**: Automated monitoring of app availability.
- **Structured Logging**: Consistent logs for monitoring and debugging.
- **Database Migrations**: Managed via Alembic.
- **Security Headers**: HSTS, CSP, X-Frame-Options, and more.

## Testing

To run the automated test suite:
```bash
pytest backend/tests
```

## Production Deployment (Docker)

1. Build the image:
```bash
docker build -t hms-app .
```

2. Run the container:
```bash
docker run -p 8000:8000 -e HMS_SECRET_KEY=your-secure-key hms-app
```

## Render Deployment

The app is pre-configured for [Render](https://render.com) using the `render.yaml` blueprint.
- **Backend Service**: Port 8000, Python runtime.
- **Frontend Service**: Static site, serves the built asset directory.
- **Database**: Managed PostgreSQL.
