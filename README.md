# SynthFocus ⚡

> **Autonomous Synthetic AI Focus Group Simulator**
> Evaluates product pitches against 10 diverse consumer personas in parallel under 90 seconds, running on a zero-cost API infrastructure.

---

## 🚀 Key Features

- **The "Synthetic 10" Personas:** Hyper-targeted agent personas ranging from *Zingy Gen-Z Trend Chasers* to *Crunch-Time Cooking Moms* and *Tech-Bro Developers*, prompted with extreme demographic and psychological specificity.
- **Zero-Cost Scaling Engine:** Proprietary Throttled Map-Reduce state machine in **LangGraph** that stays strictly within the Google Gemini Free-Tier limit (15 RPM / 1,500 RPD) via micro-batches and deterministic sleep intervals.
- **Real-Time Telemetry via SSE:** Single streaming endpoint (`POST /api/simulate-focus-group`) broadcasting batch launches, throttling timers, persona critiques, and the final playbook over Server-Sent Events (`sse-starlette`).
- **Prompt Injection Defense:** Strict data wrapping delimiters (`<<<PRODUCT_BRIEF>>> ... <<<END_PRODUCT_BRIEF>>>`) and adversarial system guardrails protecting against prompt injection and role hijacking.
- **Global Concurrency Semaphore:** Thread-safe `asyncio.Semaphore(1)` protecting API quotas by gracefully rejecting or queuing concurrent simulation requests with a clear 429 response.
- **Stateless Architecture:** Zero databases, zero user accounts, zero persistent server state ($0.00 infrastructure cost).

---

## 📂 Repository Structure

```
.
├── backend/                  # FastAPI Python 3.11 backend service
│   ├── app/
│   │   ├── agents/           # Persona evaluators and Analyst reduce agent
│   │   ├── graph/            # LangGraph StateGraph & Throttled Map-Reduce workflow
│   │   ├── models/           # Pydantic schemas & "Synthetic 10" definitions
│   │   ├── config.py         # Pydantic Settings configuration
│   │   ├── limiter.py        # In-memory IP rate limiter
│   │   └── main.py           # FastAPI entry point & SSE endpoint
│   ├── tests/                # Pytest unit & integration test suite
│   ├── Dockerfile            # Container definition for backend
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js App Router (TypeScript + Tailwind) [Phase 2]
├── docker-compose.yml        # Multi-container orchestration
├── DEPLOY.md                 # AWS ECS/Fargate deployment guide (ALB timeout notes)
└── README.md                 # Project documentation and quickstart
```

---

---

## ⚙️ Environment Variables

Configure environment variables in `backend/.env` (and optionally `frontend/.env.local`). Only variable names are documented below (never commit keys or secret values):

### Backend (`backend/.env`)
- `GOOGLE_API_KEY`: Google Gemini API key (*Required*).
- `GEMINI_MODEL`: Model identifier (Default: `gemini-3.5-flash-lite`).
- `BATCH_SIZE`: Persona micro-batch size (Default: `2`).
- `BATCH_SLEEP_SECONDS`: Deterministic sleep between batches (Default: `13`).
- `MAX_DAILY_SIMULATIONS`: Daily quota safety ceiling (Default: `120`).
- `RATE_LIMIT_SIMULATIONS_PER_HOUR`: Per-IP hourly velocity limit (Default: `10`).
- `MAX_BRIEF_LENGTH`: Maximum input characters (Default: `5000`).
- `MIN_BRIEF_LENGTH`: Minimum input characters (Default: `10`).
- `TRUSTED_PROXY_HOPS`: Trusted proxy hops behind reverse proxy/ALB (Default: `1`).
- `CORS_ORIGINS`: Comma-separated allowed origins (Default: `http://localhost:3000,http://127.0.0.1:3000`).

### Frontend (`frontend/.env.local` or Build Arg)
- `NEXT_PUBLIC_API_URL`: Backend API URL baked into client-side JS bundle at build time (e.g. `http://localhost:8000` for local Docker, or empty string `""` when deployed behind an ALB path router).

---

## 🏃 Running Locally

### Option 1: Running with Docker Compose (Recommended)
Prerequisites: Docker Engine / Docker Desktop installed.

1. Create `backend/.env` containing `GOOGLE_API_KEY=<your-key>`.
2. Run both backend (port 8000) and frontend (port 3000):
   ```bash
   docker compose up --build
   ```
3. Open `http://localhost:3000` in your browser.

### Option 2: Running Without Docker

#### Step 1: Start Backend (Python 3.11+)
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: `http://localhost:8000/api/health`
- Run Backend Tests: `pytest tests -v`

#### Step 2: Start Frontend (Node.js 20 LTS)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
- Application UI: `http://localhost:3000`
- Run Playwright Smoke Tests: `npx playwright test tests/smoke.spec.ts`

---

## 🚀 Production Deployment & AWS Architecture

For complete production deployment instructions—including AWS ECR push commands, ECS Fargate Task Definition JSON templates, AWS Application Load Balancer path-routing (`/api/*`), ALB idle timeout ($\ge 120\text{s}$), and Secrets Manager integration—see [DEPLOY.md](DEPLOY.md).

> [!WARNING]
> **Single-Instance Backend Constraint:**
> Run **exactly 1 backend task instance**. The concurrency lock (`asyncio.Semaphore(1)`) and daily quota limiter operate in-memory. Scaling out the backend across multiple tasks without distributed locks causes simultaneous API calls that exhaust Google Gemini Free-Tier quotas and break user sessions. The frontend can scale horizontally without restriction.

---

## 📊 Rate-Limit Budget & Throttling Math

| Metric | Google Free Tier Limit | SynthFocus Simulation Usage |
|---|---|---|
| **RPM (Requests per minute)** | 15 RPM | **~8.5 – 9.1 RPM** (5 batches × 2 + 1 analyst = 11 calls across ~75 seconds) |
| **RPD (Requests per day)** | 1,500 RPD | **11 calls** per simulation (~136 complete simulations/day) |
| **Safety Margin** | N/A | **~6 RPM headroom** reserved for automatic 429 exponential backoff retries |

---

## ⚖️ Disclaimer
*SynthFocus produces synthetic AI-generated simulations for market research exploration, not real human market data.*
