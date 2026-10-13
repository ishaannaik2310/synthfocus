@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo          Stopping SynthFocus
echo ==========================================

:: 1. Stop Docker Compose containers if active
where docker >nul 2>&1
if not errorlevel 1 (
    docker compose ps -q 2>nul | findstr /r /c:"." >nul 2>&1
    if not errorlevel 1 (
        echo Stopping Docker containers...
        docker compose down >nul 2>&1
    )
)

:: 2. Terminate processes listening on ports 8000 and 3000 via PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Get-NetTCPConnection -LocalPort 8000,3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 3. Fallback netstat check for ports 8000 and 3000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: 4. Close terminal windows with SynthFocus title
taskkill /FI "WINDOWTITLE eq SynthFocus Backend*" /F /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq SynthFocus Frontend*" /F /T >nul 2>&1

:: 5. Clean up any PID tracking files
if exist ".backend.pid" del /f /q ".backend.pid" >nul 2>&1
if exist ".frontend.pid" del /f /q ".frontend.pid" >nul 2>&1

echo [OK] SynthFocus processes on ports 8000 and 3000 have been stopped.
echo ==========================================
timeout /t 2 /nobreak >nul
