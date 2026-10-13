# SynthFocus PowerShell Stopper
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "Stopping SynthFocus..." -ForegroundColor Yellow

# Stop Docker containers if running
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    try {
        $runningContainers = docker compose ps -q 2>$null
        if ($runningContainers) {
            Write-Host "Stopping Docker containers..." -ForegroundColor Yellow
            docker compose down 2>$null
        }
    } catch {}
}

# Terminate processes listening on ports 8000 and 3000
try {
    $connections = Get-NetTCPConnection -LocalPort 8000, 3000 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pidToKill in $pids) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $pidToKill on port 8000/3000." -ForegroundColor Green
        }
    }
} catch {
    # Silently continue
}

# Clean up PID files
if (Test-Path "$ScriptDir\.backend.pid") { Remove-Item -Force "$ScriptDir\.backend.pid" -ErrorAction SilentlyContinue }
if (Test-Path "$ScriptDir\.frontend.pid") { Remove-Item -Force "$ScriptDir\.frontend.pid" -ErrorAction SilentlyContinue }

Write-Host "SynthFocus stopped." -ForegroundColor Green
