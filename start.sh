#!/usr/bin/env bash
set -e

# Resolve repository root directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================="
echo "         Starting SynthFocus"
echo "=========================================="

# Check for Docker mode flag (--docker or -d)
if [ "$1" = "--docker" ] || [ "$1" = "-d" ]; then
    echo "Mode: Docker Compose"
    if ! command -v docker >/dev/null 2>&1; then
        echo "[ERROR] Docker is not installed or not in PATH!"
        exit 1
    fi
    if ! docker info >/dev/null 2>&1; then
        echo "[ERROR] Docker daemon is not running! Please start Docker Desktop."
        exit 1
    fi
    # Ensure env files exist
    if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
        cp "backend/.env.example" "backend/.env"
    fi
    if [ ! -f "frontend/.env.local" ] && [ -f "frontend/.env.example" ]; then
        cp "frontend/.env.example" "frontend/.env.local"
    fi
    echo "Starting containers..."
    docker compose up --build -d
    echo "Waiting for services to become ready..."
    for i in {1..40}; do
        if curl -s http://localhost:8000/api/health >/dev/null 2>&1 && curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo "✓ Services are ready!"
            break
        fi
        sleep 1
    done
    echo ""
    echo "=========================================="
    echo " SynthFocus is running (Docker)!"
    echo " Web UI:     http://localhost:3000"
    echo " API Health: http://localhost:8000/api/health"
    echo " To stop:    Run ./stop.sh --docker"
    echo "=========================================="
    if command -v open >/dev/null 2>&1; then
        open "http://localhost:3000"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:3000"
    fi
    exit 0
fi

# Local Execution Mode

# Check and copy environment files if missing
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo "Creating backend/.env from backend/.env.example..."
        cp "backend/.env.example" "backend/.env"
    fi
fi

if [ ! -f "frontend/.env.local" ]; then
    if [ -f "frontend/.env.example" ]; then
        echo "Creating frontend/.env.local from frontend/.env.example..."
        cp "frontend/.env.example" "frontend/.env.local"
    fi
fi

# Ensure Python Virtual Environment is valid and functional
VENV_VALID=false
if [ -d "backend/venv" ] && [ -x "backend/venv/bin/python" ]; then
    if ./backend/venv/bin/python -c "import sys" >/dev/null 2>&1; then
        VENV_VALID=true
    fi
fi

if [ "$VENV_VALID" = false ]; then
    echo "Configuring Python virtual environment in backend/venv..."
    rm -rf backend/venv 2>/dev/null || true
    if command -v python3 >/dev/null 2>&1; then
        python3 -m venv backend/venv
    elif command -v python >/dev/null 2>&1; then
        python -m venv backend/venv
    else
        echo "[ERROR] Python 3 is not installed or not in PATH! Please install Python 3.11+."
        exit 1
    fi
    echo "Installing backend dependencies..."
    ./backend/venv/bin/pip install --upgrade pip >/dev/null 2>&1 || true
    ./backend/venv/bin/pip install -r backend/requirements.txt
fi

# Ensure Frontend Dependencies
if [ ! -d "frontend/node_modules" ]; then
    if ! command -v npm >/dev/null 2>&1; then
        echo "[ERROR] Node.js/npm is not installed or not in PATH! Please install Node.js 20+."
        exit 1
    fi
    echo "Installing frontend dependencies..."
    (cd frontend && npm install)
fi

# Clean up any existing instances on ports 8000 and 3000
"$DIR/stop.sh" >/dev/null 2>&1 || true

echo "Starting Backend (port 8000)..."
(cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000) > "$DIR/.backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$DIR/.backend.pid"

echo "Starting Frontend (port 3000)..."
(cd frontend && npm run dev) > "$DIR/.frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$DIR/.frontend.pid"

echo "Waiting for services to become ready..."
# Wait for backend health check (up to 30s)
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
        echo "✓ Backend is ready at http://localhost:8000"
        break
    fi
    sleep 1
done

# Wait for frontend (up to 30s)
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✓ Frontend is ready at http://localhost:3000"
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo " SynthFocus is running!"
echo " Web UI:       http://localhost:3000"
echo " Simulation:   http://localhost:3000/run"
echo " API Docs:     http://localhost:8000/docs"
echo " Backend PID:  $BACKEND_PID (logs: .backend.log)"
echo " Frontend PID: $FRONTEND_PID (logs: .frontend.log)"
echo " To stop:      Run ./stop.sh"
echo "=========================================="

# Automatically open browser if supported
if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000"
fi
