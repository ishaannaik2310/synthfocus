@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ==========================================
echo          Starting SynthFocus
echo ==========================================

:: Check for Docker mode flag
if "%1"=="--docker" goto run_docker
if "%1"=="-d" goto run_docker
goto run_local

:run_docker
echo Mode: Docker Compose
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH! Please install Docker Desktop.
    pause
    exit /b 1
)
if not exist "backend\.env" (
    if exist "backend\.env.example" copy "backend\.env.example" "backend\.env" >nul
)
if not exist "frontend\.env.local" (
    if exist "frontend\.env.example" copy "frontend\.env.example" "frontend\.env.local" >nul
)
echo Starting containers...
docker compose up --build -d
echo Waiting 5 seconds for services to initialize...
timeout /t 5 /nobreak >nul
start http://localhost:3000
echo ==========================================
echo  SynthFocus is running in Docker!
echo  Web UI:  http://localhost:3000
echo  To stop: Run stop.bat
echo ==========================================
pause
exit /b 0

:run_local
:: Check and copy environment files if missing
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo Creating backend\.env from backend\.env.example...
        copy "backend\.env.example" "backend\.env" >nul
    )
)

if not exist "frontend\.env.local" (
    if exist "frontend\.env.example" (
        echo Creating frontend\.env.local from frontend\.env.example...
        copy "frontend\.env.example" "frontend\.env.local" >nul
    )
)

:: Locate Python command
where python >nul 2>&1
if errorlevel 1 (
    where py >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python is not installed or not in PATH! Please install Python 3.11+.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

:: Validate or create backend virtual environment
set VENV_OK=0
if exist "backend\venv\Scripts\python.exe" (
    backend\venv\Scripts\python.exe -c "import sys" >nul 2>&1
    if not errorlevel 1 set VENV_OK=1
)

if %VENV_OK% equ 0 (
    echo Setting up Python virtual environment in backend\venv...
    if exist "backend\venv" rmdir /s /q "backend\venv" >nul 2>&1
    %PYTHON_CMD% -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b 1
    )
    echo Installing backend dependencies...
    call backend\venv\Scripts\pip.exe install --upgrade pip >nul 2>&1
    call backend\venv\Scripts\pip.exe install -r backend\requirements.txt
)

:: Ensure frontend dependencies
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js/npm is not installed or not in PATH! Please install Node.js 20+.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: Stop any previous instances on port 8000 and 3000
call "%~dp0stop.bat" >nul 2>&1

echo Starting Backend (FastAPI on port 8000)...
start "SynthFocus Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Starting Frontend (Next.js on port 3000)...
start "SynthFocus Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Waiting 5 seconds for services to initialize...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo ==========================================
echo  SynthFocus is running!
echo  Web UI:    http://localhost:3000
echo  API Docs:  http://localhost:8000/docs
echo  To stop:   Double-click stop.bat
echo ==========================================
pause
