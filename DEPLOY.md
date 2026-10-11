# SynthFocus Production Deployment Guide (AWS ECS Fargate & ALB)

## Overview
SynthFocus is a containerized, stateless application architected to run on **AWS Elastic Container Service (ECS)** using the **AWS Fargate** serverless launch type, fronted by an **AWS Application Load Balancer (ALB)**.

---

## 1. Single-Instance Backend Constraint (Critical)

> [!IMPORTANT]
> **Run EXACTLY ONE backend task (`desiredCount: 1`). Do NOT scale out the backend.**
> 
> **Why scaling out breaks rate limits:**
> 1. **In-Memory Concurrency Semaphore:** SynthFocus enforces an `asyncio.Semaphore(1)` to ensure only one focus group simulation runs at any given second, protecting the Google Gemini Free-Tier 15 RPM quota.
> 2. **In-Memory Daily Quota Tracker:** Daily simulation consumption (120 runs/day budget) and per-IP hourly velocity limits are managed in-memory without an external database or Redis cache to maintain a zero-cost footprint.
> 
> If you scale out to 2 or more backend tasks without a distributed lock manager, multiple instances will simultaneously dispatch requests to Gemini, immediately triggering `429 Too Many Requests` API quota rejections and breaking user sessions. The Next.js frontend, by contrast, is completely stateless and can scale to multiple tasks if desired.

---

## 2. Architecture & ALB Routing

Deploying both services behind a single Application Load Balancer allows the browser to communicate with both the frontend UI and the backend API on the **exact same origin**, eliminating cross-origin CORS latency and preflight requests:

```
Internet (User Browser)
         │
         ▼
[AWS Application Load Balancer] (Idle timeout: 180s)
         │
         ├── Rule: Path /api/*  ──> [Target Group: backend] (Port 8000)
         │                                │
         │                                ▼
         │                      ECS Fargate Task (Single Instance)
         │
         └── Rule: Default      ──> [Target Group: frontend] (Port 3000)
                                          │
                                          ▼
                                ECS Fargate Task(s) (Stateless Next.js)
```

### Application Load Balancer (ALB) Setup Rules

1. **Listener Configuration:**
   - **HTTPS (Port 443)** or **HTTP (Port 80)** listener.
   - **Rule 1 (Path-based Routing):**
     - Condition: Path pattern is `/api/*`
     - Action: Forward to Target Group `tg-synthfocus-backend` (Port 8000).
   - **Rule 2 (Default Rule):**
     - Action: Forward to Target Group `tg-synthfocus-frontend` (Port 3000).

2. **⚠️ ALB Idle Timeout Requirement ($\ge 120\text{s}$, strictly above $90\text{s}$):**
   - Each focus group simulation executes 5 micro-batches with deterministic 13-second sleep intervals, taking **~70 to 80 seconds** to stream complete results.
   - The default AWS ALB idle timeout is 60 seconds. **You must increase the ALB idle timeout to at least 120 seconds (180 seconds recommended)** to prevent AWS from closing the Server-Sent Events (SSE) stream with a `504 Gateway Timeout`.
   ```bash
   aws elbv2 modify-load-balancer-attributes \
     --load-balancer-arn <YOUR_ALB_ARN> \
     --attributes Key=idle_timeout.timeout_seconds,Value=180
   ```

3. **SSE Buffering Notes:**
   - The backend includes response header `X-Accel-Buffering: no` and emits SSE comment pings (`: ping`) every 15 seconds.
   - Ensure intermediary proxies (e.g., CloudFront, Nginx, or corporate gateways) do not buffer HTTP responses or hold chunked transfer-encoded data.

---

## 3. Health Check Paths

| Service | Container Port | Health Check Path | Expected Status | Interval | Timeout | Healthy / Unhealthy Threshold |
|---|---|---|---|---|---|---|
| **Backend** | `8000` | `/api/health` | `200 OK` | `30s` | `5s` | `2` / `3` |
| **Frontend** | `3000` | `/` | `200 OK` | `30s` | `5s` | `2` / `3` |

---

## 4. Environment Variables Reference

*(Document variable names only; never commit real secrets or credentials)*

### Backend Environment Variables
| Variable Name | Required | Default / Recommended Value | Description |
|---|---|---|---|
| `GOOGLE_API_KEY` | **Yes** | *Stored in AWS Secrets Manager* | Google AI Studio Gemini API Key. |
| `GEMINI_MODEL` | No | `gemini-3.5-flash-lite` | Designated Gemini model for simulation. |
| `BATCH_SIZE` | No | `2` | Personas per micro-batch. |
| `BATCH_SLEEP_SECONDS` | No | `13` | Deterministic sleep between batches to protect 15 RPM. |
| `MAX_DAILY_SIMULATIONS` | No | `120` | Daily cap to protect 1,500 RPD free tier quota. |
| `RATE_LIMIT_SIMULATIONS_PER_HOUR` | No | `10` | Per-client IP hourly velocity limit. |
| `MAX_BRIEF_LENGTH` | No | `5000` | Maximum character length for brief inputs. |
| `MIN_BRIEF_LENGTH` | No | `10` | Minimum character length for brief inputs. |
| `TRUSTED_PROXY_HOPS` | No | `1` | Reverse proxy hops for client IP extraction (`1` for direct ALB; `2` if CloudFront fronts the ALB). |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed CORS origins. Behind unified ALB same-origin, this can match the root domain. |

### Frontend Build Arguments & Environment Variables
| Variable Name | Build vs. Runtime | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Build Arg** | `""` (Empty string) | Baked into client-side JS bundle during `npm run build`. When using ALB path routing (`/api/*`), leave empty so the browser calls relative URLs on the same origin. For separate host setups, specify the full URL. |

---

## 5. Local Execution Guide

### Option A: Running with Docker Compose (Recommended)
Prerequisites: Docker Engine / Docker Desktop installed.

1. Create `backend/.env` with your `GOOGLE_API_KEY`.
2. Launch both services:
   ```bash
   docker compose up --build
   ```
3. Access:
   - Frontend: `http://localhost:3000`
   - Backend API & Health: `http://localhost:8000/api/health`

### Option B: Running without Docker (Direct Host)
Prerequisites: Python 3.11+, Node.js 20 LTS.

1. **Start Backend:**
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. **Start Frontend (in separate terminal):**
   ```bash
   cd frontend
   npm install
   npm run build
   npx next start -p 3000
   ```

---

## 6. AWS ECR Build & Push Commands

Authenticate Docker with your AWS ECR registry:
```bash
aws ecr get-login-password --region <AWS_REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com
```

### 1. Build & Push Backend Container:
```bash
# Build
docker build -t synthfocus-backend ./backend

# Tag
docker tag synthfocus-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/synthfocus-backend:latest

# Push
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/synthfocus-backend:latest
```

### 2. Build & Push Frontend Container:
*(Note: pass `NEXT_PUBLIC_API_URL=""` build arg so client JS uses relative paths behind ALB)*
```bash
# Build
docker build --build-arg NEXT_PUBLIC_API_URL="" -t synthfocus-frontend ./frontend

# Tag
docker tag synthfocus-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/synthfocus-frontend:latest

# Push
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/synthfocus-frontend:latest
```

---

## 7. AWS ECS Fargate Task Definition Template

Below is a complete, production-ready ECS Task Definition JSON template combining both containers into a single task (or deployable as two separate services on ECS Fargate):

```json
{
  "family": "synthfocus-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "synthfocus-backend",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/synthfocus-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "secrets": [
        {
          "name": "GOOGLE_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:<AWS_REGION>:<AWS_ACCOUNT_ID>:secret:synthfocus/google-api-key"
        }
      ],
      "environment": [
        { "name": "GEMINI_MODEL", "value": "gemini-3.5-flash-lite" },
        { "name": "BATCH_SIZE", "value": "2" },
        { "name": "BATCH_SLEEP_SECONDS", "value": "13" },
        { "name": "MAX_DAILY_SIMULATIONS", "value": "120" },
        { "name": "RATE_LIMIT_SIMULATIONS_PER_HOUR", "value": "10" },
        { "name": "MAX_BRIEF_LENGTH", "value": "5000" },
        { "name": "MIN_BRIEF_LENGTH", "value": "10" },
        { "name": "TRUSTED_PROXY_HOPS", "value": "1" },
        { "name": "CORS_ORIGINS", "value": "https://yourdomain.com,http://localhost:3000" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/synthfocus-backend",
          "awslogs-region": "<AWS_REGION>",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "synthfocus-frontend",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/synthfocus-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/synthfocus-frontend",
          "awslogs-region": "<AWS_REGION>",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
```
