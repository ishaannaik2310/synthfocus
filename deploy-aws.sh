#!/usr/bin/env bash
set -e

# Resolve repository root
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Text Styling
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "          SynthFocus AWS Cloud Deployment Tool           "
echo "=========================================================="
echo -e "${NC}"

# Parse optional command-line arguments
REGION=""
MODE=""
GOOGLE_KEY=""
STACK_NAME="synthfocus-stack"
NON_INTERACTIVE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --region) REGION="$2"; shift ;;
        --mode) MODE="$2"; shift ;;
        --gemini-key) GOOGLE_KEY="$2"; shift ;;
        --stack-name) STACK_NAME="$2"; shift ;;
        --yes|-y) NON_INTERACTIVE=true ;;
        --help|-h)
            echo "Usage: ./deploy-aws.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --region <region>       AWS Region (e.g. us-east-1)"
            echo "  --mode <1|2|3>          1: Full Deploy, 2: App Update, 3: Push Images Only"
            echo "  --gemini-key <key>      Google Gemini API Key"
            echo "  --stack-name <name>     CloudFormation stack name (default: synthfocus-stack)"
            echo "  --yes, -y               Non-interactive mode (use defaults)"
            echo "  --help, -h              Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# ========================================================
# 1. PREREQUISITES VERIFICATION
# ========================================================
echo -e "${BOLD}[1/5] Verifying Prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] AWS CLI is not installed or not in your PATH.${NC}"
    echo ""
    echo "To install the AWS CLI:"
    echo "  - macOS: brew install awscli"
    echo "  - Linux: sudo apt install awscli (or use official AWS bundled installer)"
    echo "  - Windows: winget install Amazon.AWSCLI"
    echo ""
    echo "After installation, run 'aws configure' with your AWS credentials."
    exit 1
fi
echo -e "  ${GREEN}✓ AWS CLI found:${NC} $(aws --version | awk '{print $1}')"

# Check AWS Credentials
if ! AWS_IDENTITY=$(aws sts get-caller-identity --output json 2>/dev/null); then
    echo -e "${RED}[ERROR] Unable to authenticate with AWS.${NC}"
    echo "Please configure your AWS credentials by running:"
    echo -e "  ${YELLOW}aws configure${NC}"
    echo "Ensure your IAM user or role has permissions for CloudFormation, ECS, ECR, VPC, and Secrets Manager."
    exit 1
fi
AWS_ACCOUNT_ID=$(echo "$AWS_IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
echo -e "  ${GREEN}✓ AWS Authenticated:${NC} Account ID ${BOLD}${AWS_ACCOUNT_ID}${NC}"

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not installed or not in your PATH.${NC}"
    echo "Please install Docker Desktop (https://www.docker.com/products/docker-desktop) and ensure it is running."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker daemon is not running!${NC}"
    echo "Please launch Docker Desktop and retry."
    exit 1
fi
echo -e "  ${GREEN}✓ Docker daemon is active${NC}"

# ========================================================
# 2. CONFIGURATION DETECTION & PROMPT
# ========================================================
echo ""
echo -e "${BOLD}[2/5] Configuring Deployment...${NC}"

# Resolve AWS Region
if [ -z "$REGION" ]; then
    DEFAULT_REGION=$(aws configure get region 2>/dev/null || echo "")
    if [ -z "$DEFAULT_REGION" ]; then
        DEFAULT_REGION="us-east-1"
    fi

    if [ "$NON_INTERACTIVE" = true ]; then
        REGION="$DEFAULT_REGION"
    else
        read -r -p "Enter AWS Region [$DEFAULT_REGION]: " USER_REGION
        REGION="${USER_REGION:-$DEFAULT_REGION}"
    fi
fi
echo -e "  Selected Region: ${CYAN}${REGION}${NC}"

# Resolve Google API Key
if [ -z "$GOOGLE_KEY" ]; then
    if [ -f "backend/.env" ]; then
        GOOGLE_KEY=$(grep -E "^GOOGLE_API_KEY=" backend/.env | cut -d '=' -f2- | tr -d ' "' || true)
    fi
fi

if [ -z "$GOOGLE_KEY" ] && [ "$NON_INTERACTIVE" = false ]; then
    read -r -s -p "Enter your Google Gemini API Key: " GOOGLE_KEY
    echo ""
fi

if [ -z "$GOOGLE_KEY" ]; then
    echo -e "${RED}[ERROR] Google API Key is required. Set GOOGLE_API_KEY in backend/.env or pass via --gemini-key.${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓ Google Gemini API Key resolved${NC}"

# Resolve Deployment Mode
if [ -z "$MODE" ]; then
    if [ "$NON_INTERACTIVE" = true ]; then
        MODE="1"
    else
        echo ""
        echo "Select Deployment Action:"
        echo "  [1] Full Cloud Deployment (Infrastructure + Build & Push + Deploy) - Recommended"
        echo "  [2] Quick App Update (Build & Push Docker Containers + Force ECS Rollout)"
        echo "  [3] Build & Push Docker Images to ECR only"
        read -r -p "Choose option [1]: " USER_MODE
        MODE="${USER_MODE:-1}"
    fi
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
BACKEND_IMAGE="${ECR_REGISTRY}/synthfocus-backend:latest"
FRONTEND_IMAGE="${ECR_REGISTRY}/synthfocus-frontend:latest"

# ========================================================
# 3. AMAZON ECR AUTHENTICATION & REPOSITORY SETUP
# ========================================================
echo ""
echo -e "${BOLD}[3/5] Setting up Amazon ECR Repositories...${NC}"

# Ensure ECR repositories exist
ensure_ecr_repo() {
    local REPO_NAME=$1
    if ! aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" >/dev/null 2>&1; then
        echo "Creating ECR repository: $REPO_NAME..."
        aws ecr create-repository --repository-name "$REPO_NAME" --region "$REGION" >/dev/null
    else
        echo -e "  ${GREEN}✓ ECR repository exists:${NC} $REPO_NAME"
    fi
}

ensure_ecr_repo "synthfocus-backend"
ensure_ecr_repo "synthfocus-frontend"

echo "Authenticating Docker with Amazon ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null
echo -e "  ${GREEN}✓ Logged into ECR:${NC} $ECR_REGISTRY"

# ========================================================
# 4. BUILD & PUSH DOCKER IMAGES (MULTI-PLATFORM AMD64 FOR AWS FARGATE)
# ========================================================
echo ""
echo -e "${BOLD}[4/5] Building & Pushing Container Images (linux/amd64)...${NC}"

echo "Building backend container..."
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" ./backend

echo "Pushing backend container to ECR..."
docker push "$BACKEND_IMAGE"
echo -e "  ${GREEN}✓ Backend container pushed:${NC} $BACKEND_IMAGE"

echo "Building frontend container (ALB unified origin)..."
docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL="" -t "$FRONTEND_IMAGE" ./frontend

echo "Pushing frontend container to ECR..."
docker push "$FRONTEND_IMAGE"
echo -e "  ${GREEN}✓ Frontend container pushed:${NC} $FRONTEND_IMAGE"

if [ "$MODE" = "3" ]; then
    echo ""
    echo -e "${GREEN}${BOLD}✓ Docker images pushed to ECR successfully!${NC}"
    exit 0
fi

# ========================================================
# 5. CLOUDFORMATION DEPLOYMENT OR ECS SERVICE UPDATE
# ========================================================
echo ""
echo -e "${BOLD}[5/5] Deploying Application Services to AWS...${NC}"

if [ "$MODE" = "1" ]; then
    echo "Deploying CloudFormation stack '${STACK_NAME}' (this takes ~3-5 minutes on first run)..."
    aws cloudformation deploy \
        --template-file aws/cloudformation.yml \
        --stack-name "$STACK_NAME" \
        --parameter-overrides GoogleApiKey="$GOOGLE_KEY" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$REGION"

    echo -e "  ${GREEN}✓ CloudFormation stack deployed successfully!${NC}"
fi

# Force new ECS deployment to ensure tasks pull the latest images
echo "Triggering ECS rolling deployment..."
CLUSTER_NAME="synthfocus-cluster"
aws ecs update-service --cluster "$CLUSTER_NAME" --service "synthfocus-backend-service" --force-new-deployment --region "$REGION" >/dev/null 2>&1 || true
aws ecs update-service --cluster "$CLUSTER_NAME" --service "synthfocus-frontend-service" --force-new-deployment --region "$REGION" >/dev/null 2>&1 || true

# Fetch Application Load Balancer URL
ALB_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='ApplicationUrl'].OutputValue" \
    --output text 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}      SynthFocus Successfully Deployed to AWS Cloud!      ${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}"
if [ -n "$ALB_URL" ]; then
    echo -e " Web UI Application URL: ${CYAN}${BOLD}${ALB_URL}${NC}"
    echo -e " Simulation Route:       ${CYAN}${BOLD}${ALB_URL}/run${NC}"
    echo -e " Backend Health Probe:   ${CYAN}${BOLD}${ALB_URL}/api/health${NC}"
    echo ""
    echo "Note: ALB target group health checks take ~60-90 seconds to transition to healthy."
    if command -v open >/dev/null 2>&1; then
        open "$ALB_URL"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$ALB_URL"
    fi
else
    echo "Stack deployed. You can find your ALB URL in the AWS Management Console."
fi
echo -e "${GREEN}==========================================================${NC}"
