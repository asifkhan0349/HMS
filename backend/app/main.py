import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .auth_context import get_current_user_id
from .core.config import API_PREFIX, CORS_ORIGINS, settings
from .core.database import Base, SessionLocal, engine
from .core.logging_config import setup_logging

# Initialize logging immediately
setup_logging()

# Production-ready Security and Rate Limiting
from .core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from secure import Secure, ContentSecurityPolicy

# Initialize secure headers with a policy that allows CDN assets and fonts
csp = ContentSecurityPolicy()
csp.script_src("'self'", "'unsafe-inline'", "cdn.jsdelivr.net")
csp.style_src("'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com")
csp.font_src("'self'", "fonts.gstatic.com", "cdn.jsdelivr.net")
csp.img_src("'self'", "data:", "cdn.jsdelivr.net")

secure_headers = Secure(csp=csp)
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
    # Only run automatic table creation in development. 
    # Production should strictly use Alembic migrations.
    if settings.ENV != "production":
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

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def set_secure_headers(request, call_next):
    # Skip security headers for documentation routes to ensure Swagger UI loads correctly
    path = request.url.path
    if path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
        return await call_next(request)

    response = await call_next(request)
    secure_headers.set_headers(response)

    # Enable HSTS for production if using HTTPS (suggested header)
    if settings.ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # Additional security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Catch all unhandled exceptions and return a clean JSON response.
    Prevents raw Python tracebacks from leaking in production.
    """
    import logging
    logger = logging.getLogger("uvicorn.error")
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Our team has been notified."}
    )





# Replaced the root route with SPA handling below


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

# Serve static files
# This resolves to the parent of the parent of 'app', which is the root project directory locally, or '/app' in Docker
dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dist")
assets_dir = os.path.join(dist_dir, "assets")

if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.exception_handler(404)
def spa_fallback_handler(request, exc):
    """
    Handle 404 errors by serving the SPA index.html for non-API routes.
    This allows FastAPI's /docs, /redoc, and /openapi.json to work correctly.
    """
    # Do not catch API routes - return a standard 404 JSON for these
    if request.url.path.startswith(API_PREFIX) or request.url.path.startswith("/api"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
        
    # Check if a specific file exists in dist (e.g. vite.svg, robots.txt)
    # Path is relative to dist_dir
    rel_path = request.url.path.lstrip("/")
    file_path = os.path.join(dist_dir, rel_path)
    
    if rel_path and os.path.isfile(file_path):
        return FileResponse(file_path)
        
    # Otherwise, return index.html for React Router to handle
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
        
    return JSONResponse({"detail": "Frontend not built or dist folder missing"}, status_code=404)
