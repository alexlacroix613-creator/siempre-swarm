#!/usr/bin/env python3
"""
Tennessee Market Agent — RUNTIME SESSION RUNNER
Run this for every invocation. Loads agent_id from env, creates a session,
streams the response.

Usage:
    python3 scripts/tn-market-agent-session.py
    python3 scripts/tn-market-agent-session.py --prompt "Run weekly scorecard"
    python3 scripts/tn-market-agent-session.py --prompt "Chase Good hasn't replied in 9 days — what's the recommended action?"

Environment (set in .env or shell):
    ANTHROPIC_API_KEY   — Anthropic API key
    TN_AGENT_ID         — From tn-market-agent-setup.py output
    TN_AGENT_VERSION    — From tn-market-agent-setup.py output (optional, uses latest if unset)
    TN_ENV_ID           — Environment ID from setup script
"""

import anthropic
import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime

REPO_ROOT = Path(__file__).parent.parent

# ─── Load env ────────────────────────────────────────────────────────────────

def load_env():
    env_file = REPO_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def get_api_key() -> str:
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        # Try Optimus
        result = subprocess.run(
            ["ssh", "optimus", "grep ^ANTHROPIC_API_KEY= ~/siempre-reports/.env | cut -d= -f2-"],
            capture_output=True, text=True, timeout=10
        )
        key = result.stdout.strip()
    if not key:
        raise ValueError("ANTHROPIC_API_KEY not found. Set it in .env or on Optimus.")
    return key


# ─── Default prompts for common workflows ────────────────────────────────────

DEFAULT_PROMPTS = {
    "weekly": (
        "Run a weekly Tennessee market scorecard.\n"
        "1. Assess Nashville pricing negotiation status with Chase Good — days since last reply, open items.\n"
        "2. Flag Memphis, Chattanooga, and Knoxville engagement gap with specific recommended actions.\n"
        "3. Review Supremo pricing situation and clearing plan.\n"
        "4. Produce a prioritized action list for Alex, ranked by urgency.\n"
        "Format output as: KPI Summary → Risk Flags → Priority Action List."
    ),
    "chase": (
        "Chase Good (Athens Distributing Nashville) has not replied to Nimpha's April 8 follow-up "
        "on the Nashville OP pricing proposal. It has been 5+ days. "
        "What is the recommended escalation path? Draft recommended talking points for a follow-up call. "
        "Note: comms firewall applies — output recommendations only."
    ),
    "memphis": (
        "Generate a recommended outreach strategy for Memphis with Carol Schumann and Payton Whitten "
        "at Athens Distributing. Context: Nashville pricing negotiation with Chase Good is in progress. "
        "Memphis, Chattanooga, and Knoxville have zero market development conversations. "
        "What should the approach be, what talking points, and what's the right timing relative to Nashville?"
    ),
}


# ─── Stream session events ────────────────────────────────────────────────────

def run_session(client: anthropic.Anthropic, agent_id: str, agent_version: int | None,
                env_id: str, prompt: str) -> str:
    """Create a session and stream events. Returns final text output."""

    print(f"\n[TN Market Agent] Starting session — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"[TN Market Agent] Prompt: {prompt[:100]}...\n")
    print("─" * 60)

    # Build agent reference
    agent_ref: dict = {"type": "agent", "id": agent_id}
    if agent_version:
        agent_ref["version"] = agent_version

    # Create session
    session = client.beta.sessions.create(
        agent=agent_ref,
        environment_id=env_id,
        title=f"TN Market — {datetime.now().strftime('%Y-%m-%d')}",
    )
    print(f"[Session ID: {session.id}]")

    output_parts = []

    # Stream-first: open stream BEFORE sending the message
    with client.beta.sessions.stream(session_id=session.id) as stream:
        # Send the kickoff message while stream is live
        client.beta.sessions.events.send(
            session_id=session.id,
            events=[{
                "type": "user.message",
                "content": [{"type": "text", "text": prompt}],
            }],
        )

        for event in stream:
            if event.type == "agent.message":
                for block in event.content:
                    if block.type == "text":
                        print(block.text, end="", flush=True)
                        output_parts.append(block.text)

            elif event.type == "agent.thinking":
                # Thinking blocks — print lightly so you can see it's working
                for block in event.content:
                    if hasattr(block, "thinking") and block.thinking:
                        print(f"\n[thinking...]\n", end="", flush=True)

            elif event.type == "agent.custom_tool_use":
                print(f"\n[custom tool: {event.tool_name}] {json.dumps(event.input)[:100]}")

            elif event.type == "session.status_idle":
                stop = getattr(event, "stop_reason", None)
                stop_type = getattr(stop, "type", None) if stop else None
                if stop_type != "requires_action":
                    break  # Normal completion or retries_exhausted

            elif event.type == "session.status_terminated":
                break

    print("\n" + "─" * 60)

    # Clean up
    try:
        client.beta.sessions.archive(session_id=session.id)
    except Exception:
        pass  # Best-effort cleanup

    return "".join(output_parts)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    load_env()

    parser = argparse.ArgumentParser(description="Tennessee Market Agent session runner")
    parser.add_argument("--prompt", "-p", type=str, help="Custom prompt or workflow name (weekly/chase/memphis)")
    args = parser.parse_args()

    prompt_input = args.prompt or "weekly"
    prompt = DEFAULT_PROMPTS.get(prompt_input, prompt_input)

    agent_id = os.environ.get("TN_AGENT_ID")
    env_id   = os.environ.get("TN_ENV_ID")

    if not agent_id or not env_id:
        print("❌ TN_AGENT_ID or TN_ENV_ID not set. Run tn-market-agent-setup.py first.")
        sys.exit(1)

    raw_version = os.environ.get("TN_AGENT_VERSION")
    agent_version = int(raw_version) if raw_version else None

    client = anthropic.Anthropic(api_key=get_api_key())
    output = run_session(client, agent_id, agent_version, env_id, prompt)

    # Optionally log output
    log_dir = REPO_ROOT / "data/sales-force/agent-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"tn-{datetime.now().strftime('%Y%m%d-%H%M')}.md"
    log_file.write_text(f"# TN Market Agent — {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
                        f"**Prompt:** {prompt[:200]}\n\n---\n\n{output}")
    print(f"\n[Log saved: {log_file}]")


if __name__ == "__main__":
    main()
