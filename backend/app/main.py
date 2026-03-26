from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import API_PREFIX, CORS_ORIGINS
from .database import Base, SessionLocal, engine
from .routers import appointments, auth, beds, blood_activities, blood_inventory, dashboard, inventory, invoices, medicines, patients, records, staff, tests
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="Hospital Management System API",
    version="1.0.0",
    description="FastAPI backend with SQLite storage for the HMS frontend.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "HMS backend is running."}


@app.get(f"{API_PREFIX}/health")
def health_check():
    return {"status": "ok"}


app.include_router(patients.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(appointments.router, prefix=API_PREFIX)
app.include_router(records.router, prefix=API_PREFIX)
app.include_router(invoices.router, prefix=API_PREFIX)
app.include_router(medicines.router, prefix=API_PREFIX)
app.include_router(tests.router, prefix=API_PREFIX)
app.include_router(staff.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(beds.router, prefix=API_PREFIX)
app.include_router(blood_inventory.router, prefix=API_PREFIX)
app.include_router(blood_activities.router, prefix=API_PREFIX)
app.include_router(inventory.router, prefix=API_PREFIX)
