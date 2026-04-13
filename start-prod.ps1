# Hospital Management System - Production Startup Script
# Usage: .\start-prod.ps1

param (
    [int]$Workers = 4,
    [int]$Port = 8000
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  HMS Production Startup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Run Database Migrations
Write-Host "`n[1/2] Running database migrations..." -ForegroundColor Yellow
Set-Location backend
python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Alembic migration failed. Aborting startup." -ForegroundColor Red
    exit 1
}
Write-Host "Migrations complete." -ForegroundColor Green

# Step 2: Start Uvicorn in production mode
Write-Host "`n[2/2] Starting HMS API server..." -ForegroundColor Yellow
Write-Host "  Workers: $Workers" -ForegroundColor Gray
Write-Host "  Port:    $Port" -ForegroundColor Gray
Write-Host ""

python -m uvicorn app.main:app --host 0.0.0.0 --port $Port --workers $Workers --no-access-log
