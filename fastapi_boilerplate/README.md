# FastAPI Clean Architecture Boilerplate

A clean, scalable, and production-ready backend built from scratch using FastAPI, SQLAlchemy (SQLite), and Alembic.

## Prerequisites
- Python 3.9+

## Setup & Run

1. **Create Virtual Environment & Install Dependencies:**
   ```bash
   python -m venv .venv
   # On Windows
   .\.venv\Scripts\Activate.ps1
   # On Linux/MacOS
   source .venv/bin/activate
   
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   A `.env` file is already provided for local setup. Adjust as needed.

3. **Database Setup & Migrations (Alembic):**
   Run Alembic to create the SQLite DB and configure the schema.
   ```bash
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

4. **Seed Sample Data:**
   Run the seed script to create your first admin user.
   ```bash
   python scripts/seed.py
   ```
   Admin Credentials:
   - Email: `admin@example.com`
   - Password: `adminpassword`

5. **Start the Application:**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **API Documentation:**
   Open your browser to: [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure
- `app/main.py`: Application entry point.
- `app/config.py`: Environment variable configurations using Pydantic.
- `app/database/`: Database connectivity (SQLAlchemy Engine/Session).
- `app/models/`: SQLAlchemy ORM models.
- `app/schemas/`: Pydantic Models for Data Validation.
- `app/routes/`: API endpoint definitions (Controllers).
- `app/services/`: Reusable business logic (Separation of Concerns).
- `app/utils/`: Shared utilities (Security hashers, Exception handlers).
- `alembic/`: Database migration environment and scripts.
- `scripts/`: Utilities like the seed script.
