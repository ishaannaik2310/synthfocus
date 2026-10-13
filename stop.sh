#!/usr/bin/env bash

# Resolve repository root directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================="
echo "         Stopping SynthFocus"
echo "=========================================="

# 1. Stop Docker Compose containers if running
if command -v docker >/dev/null 2>&1; then
    if docker compose ps -q 2>/dev/null | grep -q .; then
        echo "Stopping Docker containers..."
        docker compose down >/dev/null 2>&1 || true
    fi
fi

# 2. Terminate recorded PIDs
if [ -f "$DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$DIR/.backend.pid" 2>/dev/null)
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "Stopping backend process (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f "$DIR/.backend.pid"
fi

if [ -f "$DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$DIR/.frontend.pid" 2>/dev/null)
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "Stopping frontend process (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    rm -f "$DIR/.frontend.pid"
fi

# 3. Free ports 8000 and 3000 if still bound
cleanup_port() {
    local PORT=$1
    local NAME=$2
    if command -v lsof >/dev/null 2>&1; then
        local PIDS
        PIDS=$(lsof -ti :"$PORT" 2>/dev/null)
        if [ -n "$PIDS" ]; then
            echo "Stopping processes on port $PORT ($NAME)..."
            kill $PIDS 2>/dev/null || true
            sleep 1
            kill -9 $PIDS 2>/dev/null || true
        fi
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k "${PORT}/tcp" 2>/dev/null || true
    fi
}

cleanup_port 8000 "backend"
cleanup_port 3000 "frontend"

echo "✓ SynthFocus has been stopped."
echo "=========================================="
