import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .auth_context import get_current_user_id
from .config import API_PREFIX, CORS_ORIGINS, settings
from .database import Base, SessionLocal, engine

# Production-ready Security and Rate Limiting
from .limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from secure import Secure

# Initialize secure headers
secure_headers = Secure.with_default_headers()
from .routers import (
    appointments,
    auth,
    beds,
    blood_activities,
    blood_inventory,
    dashboard,
    inventory,
    invoices,
    medicines,
    patients,
    records,
    staff,
    tests,
)
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="Hospital Management System API",
    version="1.0.1",
    description="FastAPI backend with SQLite storage for the HMS frontend.",
    lifespan=lifespan,
    swagger_ui_parameters={"persistAuthorization": True},
    debug=settings.DEBUG_MODE
)

# Attach Limiter and RateLimit handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def set_secure_headers(request, call_next):
    response = await call_next(request)
    secure_headers.framework.fastapi(response)
    # Additional security headers not handled by default in Secure
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response





# Replaced the root route with SPA handling below


@app.get(f"{API_PREFIX}/health")
def health_check():
    return {"status": "ok"}


app.include_router(patients.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(appointments.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(records.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(invoices.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(medicines.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(tests.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(staff.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(dashboard.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(beds.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(blood_inventory.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(blood_activities.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])
app.include_router(inventory.router, prefix=API_PREFIX, dependencies=[Depends(get_current_user_id)])

# Serve static files and handle SPA routing
# This resolves to the parent of the parent of 'app', which is the root project directory locally, or '/app' in Docker
dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dist")
assets_dir = os.path.join(dist_dir, "assets")

if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    # Do not catch API routes
    if full_path.startswith(API_PREFIX.lstrip("/")) or full_path.startswith("api/"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
        
    # Check if a specific file exists in dist (e.g. vite.svg, robots.txt)
    file_path = os.path.join(dist_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
        
    # Otherwise, return index.html for React Router to handle
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
        
    return JSONResponse({"detail": "Frontend not built or dist folder missing"}, status_code=404)
