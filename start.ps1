# SynthFocus PowerShell Launcher
param(
    [switch]$Docker
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "         Starting SynthFocus" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($Docker) {
    Write-Host "Mode: Docker Compose" -ForegroundColor Yellow
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed or not in PATH!"
        exit 1
    }
    if (-not (Test-Path "backend\.env") -and (Test-Path "backend\.env.example")) {
        Copy-Item "backend\.env.example" "backend\.env"
    }
    if (-not (Test-Path "frontend\.env.local") -and (Test-Path "frontend\.env.example")) {
        Copy-Item "frontend\.env.example" "frontend\.env.local"
    }
    docker compose up --build -d
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:3000"
    Write-Host "SynthFocus is running in Docker! Web UI: http://localhost:3000" -ForegroundColor Green
    exit 0
}

# Check env files
if (-not (Test-Path "backend\.env") -and (Test-Path "backend\.env.example")) {
    Copy-Item "backend\.env.example" "backend\.env"
}
if (-not (Test-Path "frontend\.env.local") -and (Test-Path "frontend\.env.example")) {
    Copy-Item "frontend\.env.example" "frontend\.env.local"
}

# Ensure Python venv
$venvPython = "$ScriptDir\backend\venv\Scripts\python.exe"
$venvValid = $false
if (Test-Path $venvPython) {
    try {
        & $venvPython -c "import sys" 2>$null
        if ($LASTEXITCODE -eq 0) { $venvValid = $true }
    } catch {}
}

if (-not $venvValid) {
    Write-Host "Configuring Python virtual environment in backend\venv..." -ForegroundColor Yellow
    if (Test-Path "$ScriptDir\backend\venv") {
        Remove-Item -Recurse -Force "$ScriptDir\backend\venv" -ErrorAction SilentlyContinue
    }
    python -m venv "$ScriptDir\backend\venv"
    & "$ScriptDir\backend\venv\Scripts\pip.exe" install --upgrade pip 2>$null
    & "$ScriptDir\backend\venv\Scripts\pip.exe" install -r "$ScriptDir\backend\requirements.txt"
}

# Ensure Frontend npm dependencies
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "frontend"
    npm install
    Pop-Location
}

# Stop previous instances
& "$ScriptDir\stop.ps1"

Write-Host "Starting Backend on port 8000..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$ScriptDir\backend`" && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"

Write-Host "Starting Frontend on port 3000..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$ScriptDir\frontend`" && npm run dev"

Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SynthFocus started! Web UI: http://localhost:3000" -ForegroundColor Cyan
Write-Host " API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host " To stop:  Run .\stop.ps1" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
