@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ==========================================================
echo           SynthFocus AWS Cloud Deployment Tool
echo ==========================================================

:: 1. Verify Prerequisites
echo [1/5] Verifying Prerequisites...

where aws >nul 2>&1
if errorlevel 1 (
    echo [ERROR] AWS CLI is not installed or not in your PATH.
    echo Please install the AWS CLI using:
    echo   winget install Amazon.AWSCLI
    echo or download from https://aws.amazon.com/cli/
    pause
    exit /b 1
)

aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Unable to authenticate with AWS.
    echo Please run 'aws configure' with your AWS Access Key and Secret Key.
    pause
    exit /b 1
)

for /f "tokens=2 delims=:, " %%a in ('aws sts get-caller-identity --query "Account" --output text 2^>nul') do set AWS_ACCOUNT_ID=%%a
if "%AWS_ACCOUNT_ID%"=="" (
    for /f %%a in ('aws sts get-caller-identity --query "Account" --output text 2^>nul') do set AWS_ACCOUNT_ID=%%a
)
echo   [OK] AWS Authenticated: Account %AWS_ACCOUNT_ID%

where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in your PATH.
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo   [OK] Docker is running

:: 2. Configuration
echo.
echo [2/5] Configuring Deployment...

for /f %%r in ('aws configure get region 2^>nul') do set DEFAULT_REGION=%%r
if "%DEFAULT_REGION%"=="" set DEFAULT_REGION=us-east-1

set /p REGION="Enter AWS Region [%DEFAULT_REGION%]: "
if "%REGION%"=="" set REGION=%DEFAULT_REGION%

set GOOGLE_KEY=
if exist "backend\.env" (
    for /f "tokens=1,* delims==" %%a in (backend\.env) do (
        if "%%a"=="GOOGLE_API_KEY" set GOOGLE_KEY=%%b
    )
)

if "%GOOGLE_KEY%"=="" (
    set /p GOOGLE_KEY="Enter your Google Gemini API Key: "
)

if "%GOOGLE_KEY%"=="" (
    echo [ERROR] Google API Key is required!
    pause
    exit /b 1
)

echo.
echo Select Deployment Action:
echo   [1] Full Cloud Deployment (Infrastructure + Build & Push + Deploy)
echo   [2] Quick App Update (Build & Push Docker Containers + Force ECS Rollout)
echo   [3] Build & Push Docker Images to ECR only
set /p MODE="Choose option [1]: "
if "%MODE%"=="" set MODE=1

set ECR_REGISTRY=%AWS_ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com
set BACKEND_IMAGE=%ECR_REGISTRY%/synthfocus-backend:latest
set FRONTEND_IMAGE=%ECR_REGISTRY%/synthfocus-frontend:latest
set STACK_NAME=synthfocus-stack

:: 3. ECR Repositories
echo.
echo [3/5] Setting up Amazon ECR Repositories...
aws ecr describe-repositories --repository-names synthfocus-backend --region %REGION% >nul 2>&1
if errorlevel 1 aws ecr create-repository --repository-name synthfocus-backend --region %REGION% >nul 2>&1

aws ecr describe-repositories --repository-names synthfocus-frontend --region %REGION% >nul 2>&1
if errorlevel 1 aws ecr create-repository --repository-name synthfocus-frontend --region %REGION% >nul 2>&1

aws ecr get-login-password --region %REGION% | docker login --username AWS --password-stdin %ECR_REGISTRY% >nul 2>&1
echo   [OK] Logged into ECR: %ECR_REGISTRY%

:: 4. Build & Push
echo.
echo [4/5] Building & Pushing Containers (linux/amd64)...
echo Building backend container...
docker build --platform linux/amd64 -t %BACKEND_IMAGE% ./backend
docker push %BACKEND_IMAGE%

echo Building frontend container...
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL="" -t %FRONTEND_IMAGE% ./frontend
docker push %FRONTEND_IMAGE%

if "%MODE%"=="3" (
    echo [OK] Images pushed to ECR!
    pause
    exit /b 0
)

:: 5. CloudFormation & ECS
echo.
echo [5/5] Deploying Application Services to AWS...

if "%MODE%"=="1" (
    echo Deploying CloudFormation stack '%STACK_NAME%' (this takes ~3-5 minutes on first run)...
    aws cloudformation deploy ^
        --template-file aws\cloudformation.yml ^
        --stack-name %STACK_NAME% ^
        --parameter-overrides GoogleApiKey="%GOOGLE_KEY%" ^
        --capabilities CAPABILITY_NAMED_IAM ^
        --region %REGION%
)

echo Triggering ECS rolling deployment...
aws ecs update-service --cluster synthfocus-cluster --service synthfocus-backend-service --force-new-deployment --region %REGION% >nul 2>&1
aws ecs update-service --cluster synthfocus-cluster --service synthfocus-frontend-service --force-new-deployment --region %REGION% >nul 2>&1

for /f %%u in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %REGION% --query "Stacks[0].Outputs[?OutputKey=='ApplicationUrl'].OutputValue" --output text 2^>nul') do set ALB_URL=%%u

echo.
echo ==========================================================
echo       SynthFocus Successfully Deployed to AWS Cloud!
echo ==========================================================
if not "%ALB_URL%"=="" (
    echo  Application URL: %ALB_URL%
    start %ALB_URL%
)
echo ==========================================================
pause
