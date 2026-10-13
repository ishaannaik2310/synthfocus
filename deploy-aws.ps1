# SynthFocus PowerShell AWS Deployment Tool
param(
    [string]$Region = "",
    [string]$Mode = "1",
    [string]$GeminiKey = "",
    [string]$StackName = "synthfocus-stack",
    [switch]$NonInteractive
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "          SynthFocus AWS Cloud Deployment Tool           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Prerequisites
Write-Host "[1/5] Verifying Prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed or not in PATH! Run 'winget install Amazon.AWSCLI' to install."
    exit 1
}

try {
    $identityJson = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    $accountId = $identityJson.Account
    Write-Host "  ✓ AWS Authenticated: Account $accountId" -ForegroundColor Green
} catch {
    Write-Error "Unable to authenticate with AWS. Please run 'aws configure'."
    exit 1
}

if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH! Please install Docker Desktop."
    exit 1
}

try {
    docker info 2>$null | Out-Null
    Write-Host "  ✓ Docker daemon is active" -ForegroundColor Green
} catch {
    Write-Error "Docker daemon is not running! Please start Docker Desktop."
    exit 1
}

# 2. Configuration
Write-Host "`n[2/5] Configuring Deployment..." -ForegroundColor Yellow

if (-not $Region) {
    $defaultRegion = aws configure get region 2>$null
    if (-not $defaultRegion) { $defaultRegion = "us-east-1" }
    if ($NonInteractive) {
        $Region = $defaultRegion
    } else {
        $inputRegion = Read-Host "Enter AWS Region [$defaultRegion]"
        $Region = if ($inputRegion) { $inputRegion } else { $defaultRegion }
    }
}
Write-Host "  Selected Region: $Region" -ForegroundColor Cyan

if (-not $GeminiKey) {
    if (Test-Path "backend\.env") {
        $envLines = Get-Content "backend\.env"
        foreach ($line in $envLines) {
            if ($line -match "^GOOGLE_API_KEY=(.*)$") {
                $GeminiKey = $matches[1].Trim('"'' ')
            }
        }
    }
}

if (-not $GeminiKey -and -not $NonInteractive) {
    $GeminiKey = Read-Host "Enter your Google Gemini API Key"
}

if (-not $GeminiKey) {
    Write-Error "Google API Key is required! Set GOOGLE_API_KEY in backend\.env or pass via -GeminiKey."
    exit 1
}
Write-Host "  ✓ Google Gemini API Key resolved" -ForegroundColor Green

$ecrRegistry = "$accountId.dkr.ecr.$Region.amazonaws.com"
$backendImage = "$ecrRegistry/synthfocus-backend:latest"
$frontendImage = "$ecrRegistry/synthfocus-frontend:latest"

# 3. ECR Repositories
Write-Host "`n[3/5] Setting up Amazon ECR Repositories..." -ForegroundColor Yellow
aws ecr describe-repositories --repository-names synthfocus-backend --region $Region 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { aws ecr create-repository --repository-name synthfocus-backend --region $Region | Out-Null }

aws ecr describe-repositories --repository-names synthfocus-frontend --region $Region 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { aws ecr create-repository --repository-name synthfocus-frontend --region $Region | Out-Null }

aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ecrRegistry 2>$null | Out-Null
Write-Host "  ✓ Logged into ECR: $ecrRegistry" -ForegroundColor Green

# 4. Build & Push Images
Write-Host "`n[4/5] Building & Pushing Containers (linux/amd64)..." -ForegroundColor Yellow
Write-Host "Building backend container..." -ForegroundColor Cyan
docker build --platform linux/amd64 -t $backendImage ./backend
docker push $backendImage

Write-Host "Building frontend container..." -ForegroundColor Cyan
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL="" -t $frontendImage ./frontend
docker push $frontendImage

if ($Mode -eq "3") {
    Write-Host "`n✓ Docker images pushed to ECR successfully!" -ForegroundColor Green
    exit 0
}

# 5. CloudFormation & Services
Write-Host "`n[5/5] Deploying Application Services to AWS..." -ForegroundColor Yellow

if ($Mode -eq "1") {
    Write-Host "Deploying CloudFormation stack '$StackName'..." -ForegroundColor Cyan
    aws cloudformation deploy `
        --template-file aws\cloudformation.yml `
        --stack-name $StackName `
        --parameter-overrides GoogleApiKey="$GeminiKey" `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region
}

Write-Host "Triggering ECS rolling deployment..." -ForegroundColor Cyan
aws ecs update-service --cluster synthfocus-cluster --service synthfocus-backend-service --force-new-deployment --region $Region 2>$null | Out-Null
aws ecs update-service --cluster synthfocus-cluster --service synthfocus-frontend-service --force-new-deployment --region $Region 2>$null | Out-Null

$albUrl = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='ApplicationUrl'].OutputValue" --output text 2>$null

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "      SynthFocus Successfully Deployed to AWS Cloud!      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
if ($albUrl) {
    Write-Host " Web UI Application URL: $albUrl" -ForegroundColor Cyan
    Start-Process $albUrl
}
Write-Host "==========================================================" -ForegroundColor Green
