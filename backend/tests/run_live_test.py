"""Live verification script running a full focus group simulation for NutriSip."""
import asyncio
import json
import time
import httpx


def safe_print(text: str):
    """Safe printing on Windows console without encoding exceptions."""
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode("ascii", errors="replace").decode("ascii"))


async def run_live_test():
    url = "http://127.0.0.1:8000/api/simulate-focus-group"
    payload = {
        "product_brief": (
            "NutriSip: sugar-free electrolyte powder, 10 sachets for ₹499 (₹49.9 each). "
            "Sweetened with stevia, no artificial colours, 500 mg sodium and 200 mg potassium per sachet, "
            "flavours: lemon-mint and mango. Recyclable paper sachets. Subscribe and save 15%. "
            "Targeted at gym-goers and office workers in Indian cities."
        )
    }

    safe_print("=" * 80)
    safe_print("STARTING LIVE BACKEND SIMULATION FOR NUTRISIP")
    safe_print(f"Target URL: {url}")
    safe_print(f"Product Brief: {payload['product_brief']}")
    safe_print("=" * 80)

    start_time = time.time()
    raw_events = []
    persona_results = []
    final_report = None

    async with httpx.AsyncClient(timeout=180.0) as client:
        async with client.stream("POST", url, json=payload, headers={"Accept": "text/event-stream"}) as response:
            safe_print(f"Response Status Code: {response.status_code}")
            safe_print(f"Response Headers: {dict(response.headers)}")
            safe_print("-" * 80)
            safe_print("STREAMING SSE EVENTS:")
            safe_print("-" * 80)

            current_event = None
            current_data = []

            async for line in response.aiter_lines():
                line = line.strip()
                if not line:
                    if current_event and current_data:
                        raw_data_str = "\n".join(current_data)
                        safe_print(f"[{time.time() - start_time:6.2f}s] EVENT: {current_event}")
                        safe_print(f"         DATA: {raw_data_str[:160]}..." if len(raw_data_str) > 160 else f"         DATA: {raw_data_str}")
                        try:
                            parsed_data = json.loads(raw_data_str)
                            raw_events.append({"event": current_event, "data": parsed_data})
                            if current_event == "batch_complete":
                                persona_results.extend(parsed_data.get("personas_evaluated", []))
                            elif current_event == "final_report":
                                final_report = parsed_data
                        except Exception:
                            raw_events.append({"event": current_event, "data": raw_data_str})

                        current_event = None
                        current_data = []
                    continue

                if line.startswith("event:"):
                    current_event = line.replace("event:", "").strip()
                elif line.startswith("data:"):
                    current_data.append(line.replace("data:", "").strip())
                elif line.startswith(":"):
                    safe_print(f"[{time.time() - start_time:6.2f}s] HEARTBEAT: {line}")

    total_elapsed = time.time() - start_time

    safe_print("=" * 80)
    safe_print(f"SIMULATION COMPLETE. Total Elapsed Time: {total_elapsed:.2f} seconds")
    safe_print(f"Total SSE Events Received: {len(raw_events)}")
    safe_print(f"Total Personas Evaluated: {len(persona_results)}")
    safe_print("=" * 80)

    # Output Persona Matrix & Homogenization Analysis
    safe_print("\n" + "=" * 80)
    safe_print("THE SYNTHETIC 10 PERSONA EVALUATION BREAKDOWN:")
    safe_print("=" * 80)
    scores = []
    for idx, p in enumerate(persona_results, 1):
        score = p.get("score_out_of_10", 0)
        scores.append(score)
        buy = "[BUY READY]" if p.get("buy_readiness") else "[NO PURCHASE]"
        safe_print(f"\n[{idx}/10] {p.get('persona_name')} | Score: {score}/10 | {buy}")
        safe_print(f"     Primary Objection: {p.get('primary_objection')}")
        safe_print(f"     Ruthless Critique: \"{p.get('one_sentence_critique')}\"")
        if p.get("key_frustrations"):
            safe_print(f"     Frustrations: {', '.join(p.get('key_frustrations'))}")

    safe_print("\n" + "=" * 80)
    safe_print("HOMOGENIZATION & STATISTICAL SCORE SPREAD ANALYSIS:")
    safe_print("=" * 80)
    if scores:
        min_s = min(scores)
        max_s = max(scores)
        avg_s = sum(scores) / len(scores)
        score_range = max_s - min_s
        # Count frequency of each score
        freq = {}
        for s in scores:
            freq[s] = freq.get(s, 0) + 1
        most_common_count = max(freq.values())

        safe_print(f"Score Distribution: {scores}")
        safe_print(f"Score Range: {min_s} to {max_s} (Spread: {score_range} points)")
        safe_print(f"Average Score: {avg_s:.1f} / 10")
        safe_print(f"Buy-Ready Count: {sum(1 for p in persona_results if p.get('buy_readiness'))} / {len(persona_results)}")

        if score_range <= 1 or most_common_count >= 7:
            safe_print("⚠️ WARNING: High score clustering detected! Personas gave nearly identical scores.")
        elif score_range >= 4:
            safe_print("✅ SUCCESS: Strong demographic diversity! Distinct personas showed sharply divergent reactions.")
        else:
            safe_print("ℹ️ MODERATE DIVERSITY: Acceptable variance across personas.")

    if final_report:
        safe_print("\n" + "=" * 80)
        safe_print("FULL ANALYST EXECUTIVE PLAYBOOK:")
        safe_print("=" * 80)
        safe_print("EXECUTIVE SUMMARY:")
        safe_print(final_report.get("executive_summary", ""))
        safe_print("\n" + "-" * 80)
        safe_print("TACTICAL PLAYBOOK (MARKDOWN):")
        safe_print(final_report.get("playbook_markdown", ""))
        safe_print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_live_test())
