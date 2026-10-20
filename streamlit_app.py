"""
SynthFocus — Streamlit UI Dashboard
Direction A: Kinetic Cobalt Design System Implementation

Adheres strictly to DESIGN.md tokens:
- Primary Canvas: #133EE8 (Saturated Cobalt)
- Deep Canvas: #0E2CB3
- Primary Card Surface: #FFFFFF (Stark White)
- Primary CTA Accent: #FFE500 (Electric Lemon Yellow)
- Display Headlines: Oswald / Impact uppercase
- Body: Inter
- Monospace: JetBrains Mono (Telemetry, Timers, Eyebrows)
- Flat, open layout (No cards-inside-cards)
- Ranked list views with inline yellow score bars (No radar charts)
"""

import asyncio
from datetime import datetime
import json
import os
from pathlib import Path
import queue
import sys
import threading
import time
from typing import Any, AsyncGenerator, Dict, Iterator, List, Optional

import httpx
import streamlit as st

# Configure page layout and metadata
st.set_page_config(
    page_title="SynthFocus — Synthetic AI Focus Group",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Auto-inject backend and virtual environment site-packages into sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"

possible_site_packages = [
    BACKEND_DIR / "venv" / "Lib" / "site-packages",
    BACKEND_DIR / "venv" / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages",
    PROJECT_ROOT / ".venv" / "Lib" / "site-packages",
    PROJECT_ROOT / ".venv" / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages",
]

for sp in possible_site_packages:
    if sp.exists() and str(sp) not in sys.path:
        sys.path.insert(0, str(sp))

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Preset briefs for quick 1-click demos
PRESET_BRIEFS = {
    "Aura Hydration (D2C CPG)": (
        "Aura Hydration is a zero-sugar mineral electrolyte powder sachet formulated for peak mental focus and daily hydration. "
        "Contains 500mg sodium from pure pink Himalayan rock salt, 200mg potassium citrate, and 60mg chelated magnesium glycinate. "
        "Sweetened naturally with organic monk fruit extract — zero sucralose, zero aspartame, zero artificial dyes. "
        "Packaged in sleek, matte-black pocket sachets. Dissolves instantly in 500ml cold water with a crisp citrus-yuzu profile. "
        "Targeted at health-conscious urban professionals, fitness enthusiasts, and intermittent fasters. Priced at ₹799 ($9.50) for a 30-pack box."
    ),
    "KubeZero (B2B DevOps)": (
        "KubeZero is an ultra-lightweight, single-binary microVM orchestrator designed to replace heavy Kubernetes clusters for edge environments. "
        "Boots sub-millisecond isolated Linux microVMs with a sub-50MB memory footprint. Native declarative YAML syntax, zero etcd overhead, "
        "and automatic peer-to-peer mesh networking over WireGuard. Built with Rust. Open-source core with an enterprise control plane for compliance."
    ),
    "SleepSync (Wearable Biohack)": (
        "SleepSync is a minimalist titanium smart ring with embedded micro-spectrometry sensors that continuously tracks core body temperature, "
        "heart-rate variability (HRV), and circadian rhythm shifts. Automatically synchronizes with smart home lighting and thermostats to induce deep sleep phases. "
        "No monthly subscription. All sleep data is encrypted and stored locally on your device with zero cloud telemetry."
    ),
}

# Inject Direction A (Kinetic Cobalt) Design System CSS
KINETIC_COBALT_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Oswald:wght@500;600;700&display=swap');

/* Canvas & Global Surfaces */
html, body, [data-testid="stAppViewContainer"] {
    background-color: #133EE8 !important;
    color: #FFFFFF !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
}

[data-testid="stHeader"] {
    background-color: rgba(19, 62, 232, 0.95) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
}

[data-testid="stSidebar"] {
    background-color: #0E2CB3 !important;
    border-right: 1px solid rgba(255, 255, 255, 0.15) !important;
}

[data-testid="stSidebar"] * {
    color: #FFFFFF !important;
}

/* Typography Classes */
.eyebrow {
    font-family: 'JetBrains Mono', monospace !important;
    text-transform: uppercase !important;
    letter-spacing: 0.22em !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #FFE500 !important;
    margin-bottom: 6px !important;
    display: inline-block !important;
}

.display-headline {
    font-family: 'Oswald', 'Impact', sans-serif !important;
    text-transform: uppercase !important;
    letter-spacing: -0.02em !important;
    line-height: 0.95 !important;
    font-weight: 700 !important;
    color: #FFFFFF !important;
    font-size: clamp(34px, 4vw, 56px) !important;
    margin-bottom: 12px !important;
}

.subheadline {
    color: #DCE4FF !important;
    font-size: 15px !important;
    line-height: 1.5 !important;
    margin-bottom: 24px !important;
}

/* Primary Action Buttons */
div.stButton > button {
    background-color: #FFE500 !important;
    color: #000000 !important;
    font-family: 'Oswald', sans-serif !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    border-radius: 4px !important;
    border: none !important;
    padding: 10px 22px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    transition: transform 0.1s ease, background-color 0.15s ease !important;
    width: 100% !important;
}

div.stButton > button:hover {
    background-color: #F0D800 !important;
    color: #000000 !important;
    transform: scale(0.99) !important;
}

/* Inputs and Textareas */
.stTextArea textarea {
    background-color: #0E2CB3 !important;
    color: #FFFFFF !important;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
    border-radius: 4px !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
}

.stTextArea textarea:focus {
    border-color: #FFE500 !important;
    box-shadow: 0 0 0 1px #FFE500 !important;
}

/* Telemetry & Ticker Box */
.telemetry-ticker {
    background-color: #0E2CB3;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 4px;
    padding: 12px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #DCE4FF;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.telemetry-dot {
    width: 8px;
    height: 8px;
    background-color: #FFE500;
    border-radius: 50%;
    display: inline-block;
    box-shadow: 0 0 8px #FFE500;
}

/* Metric Cards */
.metric-tile {
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 4px;
    padding: 18px;
    text-align: center;
}

.metric-value {
    font-family: 'Oswald', sans-serif;
    font-size: 38px;
    font-weight: 700;
    color: #FFE500;
    line-height: 1;
    margin-bottom: 4px;
}

.metric-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #DCE4FF;
}

/* Persona Evaluation Cards (Stark White #FFFFFF surface) */
.persona-card {
    background-color: #FFFFFF;
    color: #0A0A0A;
    border-radius: 4px;
    padding: 22px 24px;
    margin-bottom: 18px;
    border-left: 6px solid #FFE500;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
}

.persona-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    border-bottom: 1px solid #E5E7EB;
    padding-bottom: 10px;
}

.persona-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.persona-avatar {
    font-size: 24px;
    background: #F3F4F6;
    padding: 6px 10px;
    border-radius: 4px;
}

.persona-name {
    font-family: 'Oswald', sans-serif;
    font-size: 20px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: #0A0A0A;
}

.score-badge {
    font-family: 'Oswald', sans-serif;
    font-size: 24px;
    font-weight: 700;
    background-color: #FFE500;
    color: #000000;
    padding: 4px 14px;
    border-radius: 4px;
    display: inline-block;
}

.score-bar-bg {
    width: 100%;
    height: 6px;
    background-color: #E5E7EB;
    border-radius: 3px;
    margin: 8px 0 16px 0;
    overflow: hidden;
}

.score-bar-fill {
    height: 100%;
    background-color: #FFE500;
    border-radius: 3px;
}

.hot-take {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 10px;
    line-height: 1.4;
    font-style: italic;
}

.objection-box {
    background-color: #F9FAFB;
    border-left: 3px solid #EF4444;
    padding: 10px 14px;
    font-size: 13px;
    color: #374151;
    margin-bottom: 10px;
    border-radius: 0 4px 4px 0;
}

.frustrations-tag {
    display: inline-block;
    background-color: #F3F4F6;
    color: #4B5563;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 3px;
    margin-right: 6px;
    margin-top: 4px;
}

/* Throttling Progress Container */
.throttle-box {
    background-color: #0E2CB3;
    border: 1px dashed #FFE500;
    padding: 16px;
    border-radius: 4px;
    margin: 16px 0;
    text-align: center;
}

/* Playbook styling */
.playbook-container {
    background-color: #0E2CB3;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 24px 28px;
    color: #FFFFFF;
}

.playbook-container h2 {
    font-family: 'Oswald', sans-serif !important;
    text-transform: uppercase !important;
    color: #FFE500 !important;
    letter-spacing: 0.02em !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 8px;
    margin-top: 24px;
}

.playbook-container ul {
    list-style-type: none;
    padding-left: 0;
}

.playbook-container li {
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
"""

st.markdown(KINETIC_COBALT_CSS, unsafe_allow_html=True)


# --- Simulation Runners ---

def sse_event_stream_fastapi(api_url: str, brief: str) -> Iterator[Dict[str, Any]]:
    """Streams Server-Sent Events from the running FastAPI backend with friendly connection error handling."""
    endpoint = f"{api_url.rstrip('/')}/api/simulate-focus-group"
    try:
        with httpx.Client(timeout=180.0) as client:
            with client.stream(
                "POST",
                endpoint,
                json={"product_brief": brief},
                headers={"Accept": "text/event-stream"},
            ) as response:
                if response.status_code != 200:
                    err_text = response.read().decode("utf-8", errors="replace")
                    try:
                        err_json = json.loads(err_text)
                        msg = err_json.get("detail", err_text)
                    except Exception:
                        msg = err_text
                    yield {"event": "error", "data": {"message": f"HTTP {response.status_code}: {msg}"}}
                    return

                buffer = ""
                for chunk in response.iter_text():
                    buffer += chunk
                    while "\n\n" in buffer:
                        frame, buffer = buffer.split("\n\n", 1)
                        event_type = "message"
                        data_lines = []
                        for line in frame.splitlines():
                            line = line.strip()
                            if not line or line.startswith(":"):
                                continue
                            if line.startswith("event:"):
                                event_type = line[6:].strip()
                            elif line.startswith("data:"):
                                data_lines.append(line[5:].strip())

                        if data_lines:
                            try:
                                parsed_data = json.loads("\n".join(data_lines))
                                yield {"event": event_type, "data": parsed_data}
                            except Exception:
                                pass
    except (httpx.ConnectError, httpx.NetworkError) as exc:
        yield {
            "event": "error",
            "data": {
                "message": (
                    f"FastAPI backend connection refused at {api_url} ([WinError 10061]).\n\n"
                    "The backend server is not currently running. You can:\n"
                    "1. Switch to 'Direct In-Process Engine' in the sidebar (runs locally without FastAPI), OR\n"
                    "2. Start the FastAPI backend in a separate terminal: `uvicorn app.main:app --port 8000` inside `backend/`."
                )
            },
        }
    except Exception as exc:
        yield {"event": "error", "data": {"message": f"Network exception: {exc}"}}


def sse_event_stream_direct_sync(brief: str) -> Iterator[Dict[str, Any]]:
    """Runs the LangGraph simulation generator in a background thread and yields events synchronously in real time."""
    q: queue.Queue = queue.Queue()

    def worker():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            from app.graph.workflow import run_simulation_generator
            async def run():
                async for event in run_simulation_generator(product_brief=brief):
                    q.put(event)
            loop.run_until_complete(run())
        except Exception as exc:
            q.put({"event": "error", "data": {"message": f"Direct Engine error: {exc}"}})
        finally:
            q.put(None)
            loop.close()

    t = threading.Thread(target=worker, daemon=True)
    t.start()

    while True:
        item = q.get()
        if item is None:
            break
        yield item


# --- UI Layout ---

# Sidebar Controls
with st.sidebar:
    st.markdown('<div class="eyebrow">CONTROL MATRIX</div>', unsafe_allow_html=True)
    st.markdown("### Simulation Engine")
    
    # Auto-detect FastAPI gateway status
    api_url = "http://127.0.0.1:8000"
    fastapi_online = False
    try:
        r = httpx.get(f"{api_url.rstrip('/')}/api/health", timeout=1.0)
        fastapi_online = (r.status_code == 200)
    except Exception:
        fastapi_online = False

    default_mode_index = 0 if fastapi_online else 1

    execution_mode = st.radio(
        "Execution Mode",
        options=["FastAPI SSE Stream (Port 8000)", "Direct In-Process Engine"],
        index=default_mode_index,
        help="FastAPI SSE connects to your running backend. Direct Engine executes LangGraph locally.",
    )
    
    if "FastAPI" in execution_mode:
        api_url = st.text_input("Backend API URL", value=api_url)
        if fastapi_online:
            st.success("● FastAPI Gateway Online", icon="⚡")
        else:
            st.error("● FastAPI Offline (Port 8000)")
            st.caption("Start the backend in a separate terminal: `uvicorn app.main:app --port 8000` inside `backend/`, or select 'Direct In-Process Engine' above.")
    else:
        st.info("● Direct Engine Active (runs LangGraph locally without requiring FastAPI server)", icon="💡")

    st.markdown("---")
    st.markdown('<div class="eyebrow">PRESET PITCHES</div>', unsafe_allow_html=True)
    selected_preset = st.selectbox(
        "Load Test Brief",
        options=["Custom Brief"] + list(PRESET_BRIEFS.keys()),
        index=1,
    )

    st.markdown("---")
    st.markdown(
        """
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #DCE4FF; line-height: 1.6;">
            <strong>THROTTLED MAP-REDUCE SPEC:</strong><br>
            • Model: Gemini Flash-Lite<br>
            • Personas: 10 Synthetics<br>
            • Batches: 5 × 2 Personas<br>
            • Throttling: 13s Sleep<br>
            • Daily Cap: 120 Runs/Day
        </div>
        """,
        unsafe_allow_html=True,
    )


# Main Content Header
st.markdown('<div class="eyebrow">SYNTHETIC CONSUMER LABORATORY</div>', unsafe_allow_html=True)
st.markdown('<div class="display-headline">SYNTHFOCUS DASHBOARD</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="subheadline">Stress-test your product pitch against 10 ruthlessly calibrated synthetic consumer personas before spending a dollar on ad spend.</div>',
    unsafe_allow_html=True,
)

# Product Brief Input Area
default_text = PRESET_BRIEFS.get(selected_preset, "") if selected_preset != "Custom Brief" else ""
brief_input = st.text_area(
    "Product Concept / Landing Page Copy / Pitch Deck Text",
    value=default_text,
    height=160,
    placeholder="Enter 10 to 5,000 characters of product copy, target audience claims, pricing, and value propositions...",
)

char_count = len(brief_input.strip())
col_chars, col_btn = st.columns([3, 1])

with col_chars:
    st.markdown(
        f"<span style='font-family: \"JetBrains Mono\", monospace; font-size: 12px; color: #DCE4FF;'>"
        f"CHARACTER COUNT: {char_count} / 5000 (MIN 10)"
        f"</span>",
        unsafe_allow_html=True,
    )

start_simulation = col_btn.button("LAUNCH SIMULATION ⚡")

# Execution & Live State Handling
if start_simulation:
    if char_count < 10:
        st.error("Product brief must be at least 10 characters long.")
    elif char_count > 5000:
        st.error("Product brief exceeds 5,000 character maximum.")
    else:
        st.markdown("---")
        
        # Placeholders for live streaming widgets
        ticker_placeholder = st.empty()
        progress_placeholder = st.empty()
        throttle_placeholder = st.empty()
        metrics_placeholder = st.empty()
        cards_container = st.container()
        playbook_placeholder = st.empty()

        all_personas: List[Dict[str, Any]] = []
        final_report: Optional[Dict[str, Any]] = None

        progress_bar = progress_placeholder.progress(0, text="Initializing LangGraph Map-Reduce Pipeline...")

        def update_ticker(msg: str):
            ticker_placeholder.markdown(
                f'<div class="telemetry-ticker"><span class="telemetry-dot"></span>{msg}</div>',
                unsafe_allow_html=True,
            )

        try:
            # Dispatch event stream
            if "FastAPI" in execution_mode:
                event_stream = sse_event_stream_fastapi(api_url, brief_input)
            else:
                event_stream = sse_event_stream_direct_sync(brief_input)

            for item in event_stream:
                ev_type = item.get("event")
                data = item.get("data", {})

                if ev_type == "start":
                    total_p = data.get("total_personas", 10)
                    total_b = data.get("total_batches", 5)
                    update_ticker(f"Simulation started. Evaluating {total_p} personas across {total_b} micro-batches.")
                    progress_bar.progress(5, text="Ingesting personas into state graph...")

                elif ev_type == "batch_start":
                    throttle_placeholder.empty()
                    b_idx = data.get("batch_index", 0)
                    total_b = data.get("total_batches", 5)
                    persona_names = ", ".join([p.get("name", "") for p in data.get("personas", [])])
                    update_ticker(f"Active Batch {b_idx + 1}/{total_b}: {persona_names} evaluating pitch...")
                    pct = int(((b_idx) / total_b) * 75) + 5
                    progress_bar.progress(pct, text=f"Processing Batch {b_idx + 1}/{total_b}...")

                elif ev_type == "batch_complete":
                    b_idx = data.get("batch_index", 0)
                    total_b = data.get("total_batches", 5)
                    new_evals = data.get("personas_evaluated", [])
                    all_personas.extend(new_evals)

                    pct = int(((b_idx + 1) / total_b) * 75) + 5
                    progress_bar.progress(pct, text=f"Batch {b_idx + 1}/{total_b} evaluations registered.")
                    
                    # Render updated cards live
                    with cards_container:
                        cards_html = ""
                        for p in all_personas:
                            score = p.get("score_out_of_10", 5)
                            pct_fill = score * 10
                            frustrations = "".join([f'<span class="frustrations-tag">#{f}</span>' for f in p.get("key_frustrations", [])])
                            cards_html += f"""
                            <div class="persona-card">
                                <div class="persona-header">
                                    <div class="persona-title-group">
                                        <span class="persona-name">{p.get('persona_name', 'Persona')}</span>
                                    </div>
                                    <div class="score-badge">{score}/10</div>
                                </div>
                                <div class="score-bar-bg">
                                    <div class="score-bar-fill" style="width: {pct_fill}%;"></div>
                                </div>
                                <div class="hot-take">"{p.get('one_sentence_critique', '')}"</div>
                                <div class="objection-box">
                                    <strong>Primary Friction:</strong> {p.get('primary_objection', '')}
                                </div>
                                <div>{frustrations}</div>
                            </div>
                            """
                        cards_container.markdown(cards_html, unsafe_allow_html=True)

                elif ev_type == "throttling":
                    sleep_sec = data.get("seconds_remaining", 13)
                    next_b = data.get("batch_index", 0) + 2
                    update_ticker(f"Rate-limit guard: Throttling for {sleep_sec}s before Batch {next_b}...")
                    
                    # Live countdown in Streamlit
                    for s in range(sleep_sec, 0, -1):
                        throttle_placeholder.markdown(
                            f'<div class="throttle-box">'
                            f'<span style="font-family: \'JetBrains Mono\'; font-size: 13px; color: #FFE500;">'
                            f'⏳ FREE-TIER 15 RPM SAFETY GUARD — RESUMING BATCH {next_b} IN {s} SECONDS...'
                            f'</span></div>',
                            unsafe_allow_html=True,
                        )
                        time.sleep(1)
                    throttle_placeholder.empty()

                elif ev_type == "analyst_start":
                    throttle_placeholder.empty()
                    update_ticker("Map phase finished. Chief Analyst synthesizing consensus metrics & tactical playbook...")
                    progress_bar.progress(85, text="Chief Analyst synthesizing Executive Playbook...")

                elif ev_type == "final_report":
                    final_report = data
                    progress_bar.progress(100, text="Simulation Complete.")
                    update_ticker("Simulation complete. Executive report generated.")
                    break

                elif ev_type == "error":
                    err_msg = data.get("message", "Unknown simulation error.")
                    st.error(f"Simulation Error: {err_msg}")
                    break

            # Render Metrics & Executive Playbook if completed
            if final_report:
                metrics = final_report.get("metrics", {})
                avg_score = metrics.get("average_score", 0.0)
                buy_ready = metrics.get("buy_ready_count", 0)
                std_dev = metrics.get("score_spread", 0.0)
                min_s = metrics.get("min_score", 0)
                max_s = metrics.get("max_score", 0)

                # Render Top-Level Quantitative KPI Grid
                with metrics_placeholder:
                    m1, m2, m3, m4 = st.columns(4)
                    with m1:
                        st.markdown(
                            f'<div class="metric-tile"><div class="metric-value">{avg_score}/10</div><div class="metric-label">MEAN SCORE (μ)</div></div>',
                            unsafe_allow_html=True,
                        )
                    with m2:
                        st.markdown(
                            f'<div class="metric-tile"><div class="metric-value">{buy_ready}/10</div><div class="metric-label">BUY READY RATIO</div></div>',
                            unsafe_allow_html=True,
                        )
                    with m3:
                        st.markdown(
                            f'<div class="metric-tile"><div class="metric-value">±{std_dev}</div><div class="metric-label">SCORE SPREAD (σ)</div></div>',
                            unsafe_allow_html=True,
                        )
                    with m4:
                        st.markdown(
                            f'<div class="metric-tile"><div class="metric-value">{min_s} – {max_s}</div><div class="metric-label">SCORE RANGE</div></div>',
                            unsafe_allow_html=True,
                        )

                # Render Executive Playbook
                with playbook_placeholder:
                    st.markdown("###")
                    st.markdown('<div class="eyebrow">EXECUTIVE ANALYSIS</div>', unsafe_allow_html=True)
                    st.markdown('<div class="display-headline">TACTICAL OBJECTION PLAYBOOK</div>', unsafe_allow_html=True)
                    
                    exec_summary = final_report.get("executive_summary", "")
                    playbook_md = final_report.get("playbook_markdown", "")
                    disclaimer = final_report.get("disclaimer", "")

                    st.markdown(
                        f"""
                        <div class="playbook-container">
                            <h3 style="font-family: 'Oswald'; text-transform: uppercase; color: #FFE500; margin-top: 0;">Market Consensus Summary</h3>
                            <p style="font-size: 15px; line-height: 1.6; color: #DCE4FF;">{exec_summary}</p>
                            <hr style="border-color: rgba(255, 255, 255, 0.15); margin: 20px 0;">
                            <div>
                                {playbook_md}
                            </div>
                            <div style="margin-top: 24px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #A5B4FC;">
                                DISCLAIMER: {disclaimer}
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

        except Exception as e:
            st.error(f"Simulation interrupted: {e}")
