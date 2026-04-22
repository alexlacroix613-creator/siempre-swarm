#!/usr/bin/env python3
"""
Tennessee Market Agent — ONE-TIME SETUP
Run once. Store the returned agent_id in your .env or config.
Never run this in the hot path.

Usage:
    python3 scripts/tn-market-agent-setup.py

Outputs:
    Prints TN_AGENT_ID and TN_AGENT_VERSION to stdout.
    Add them to your .env:
        TN_AGENT_ID=agent_...
        TN_AGENT_VERSION=...
"""

import anthropic
import os
from pathlib import Path

# ─── Load foundation + dossier ────────────────────────────────────────────────

REPO_ROOT = Path(__file__).parent.parent
FOUNDATION_PATH = REPO_ROOT / "data/sales-force/foundation.md"
DOSSIER_PATH    = REPO_ROOT / "data/sales-force/dossiers/tennessee-tn-dossier.md"

foundation = FOUNDATION_PATH.read_text()
dossier    = DOSSIER_PATH.read_text()

# ─── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = f"""You are the dedicated Market Manager for Tennessee (TN) — a Tier 2, franchise-flagged market in the Siempre Spirits national AI sales force.

## Your Identity
You own ONE market: Tennessee. You have deep, live knowledge of this market including the distributor relationship, pricing negotiations, and metro-level gaps.

## Non-Negotiable Constraints
- COMMS FIREWALL: You NEVER contact anyone outside @siempretequila.com. All recommendations surface as "RECOMMENDED ACTION: [who] [what] [why]" — never the action itself.
- FRANCHISE FLAG: Tennessee franchise law (TN Code Ann. § 57-3-801 et seq.) protects Athens Distributing. Never recommend a distributor change. Escalate any relationship restructure to Alex + legal.
- ESCALATION PATH: Market Agent → Sales Director → Solace → Alex/Nick/Monica

## Your Core Job
1. Monitor the Nashville pricing negotiation with Chase Good — track days since last reply, flag if >7 days silent
2. Track the Memphis/Chattanooga/Knoxville engagement gap — these three cities have zero market development conversations
3. Watch for Supremo pricing resolution — $59.99 retail is broken, needs FOB fix or clearing plan
4. Monitor AR outstanding invoices status
5. Produce KPI scoring and actionable next-step recommendations

## Reporting Source
VIP iDig for US depletion data (confirmed set up by Parker Sherer, Athens Distributing Operations Manager, March 30 2026). If data gaps exist, contact Kelsie Johnson (VIP rep).

## Tone
Siempre is scrappy. You're a hustler with Diageo-level discipline. Direct, fast, no corporate fluff. Every recommendation leads with the number or the action, not the backstory.

---

{foundation}

---

{dossier}
"""

# ─── Create the Environment (if not already done) ─────────────────────────────

def get_or_create_environment(client: anthropic.Anthropic) -> str:
    """Reuse existing TN agent environment or create one."""
    envs = client.beta.environments.list()
    for env in envs:
        if env.name == "siempre-tn-market-agent":
            print(f"Reusing existing environment: {env.id}")
            return env.id

    env = client.beta.environments.create(
        name="siempre-tn-market-agent",
        config={
            "type": "cloud",
            "networking": {"type": "unrestricted"},
        },
    )
    print(f"Created environment: {env.id}")
    return env.id


# ─── Create the Agent ─────────────────────────────────────────────────────────

def create_tn_agent(client: anthropic.Anthropic) -> tuple[str, int]:
    """Create the Tennessee market agent. Run once."""
    agent = client.beta.agents.create(
        name="Tennessee Market Manager",
        model="claude-opus-4-6",
        description=(
            "Tier 2 market manager for Tennessee (TN). "
            "Owns distributor strategy (Athens Distributing), account priorities, "
            "pricing discipline, and KPI tracking. "
            "Nashville active, Memphis/Chattanooga/Knoxville not yet engaged."
        ),
        system=SYSTEM_PROMPT,
        tools=[
            {
                "type": "agent_toolset_20260401",
                "default_config": {"enabled": True},
                "configs": [
                    # Disable bash to keep the agent read-only by default.
                    # Re-enable for deeper analysis sessions where you need it.
                    {"name": "bash", "enabled": False},
                ],
            }
        ],
    )

    print(f"\n✅ Tennessee Market Agent created successfully!")
    print(f"   TN_AGENT_ID={agent.id}")
    print(f"   TN_AGENT_VERSION={agent.version}")
    print(f"\nAdd these to your .env:")
    print(f"   TN_AGENT_ID={agent.id}")
    print(f"   TN_AGENT_VERSION={agent.version}")

    return agent.id, agent.version


if __name__ == "__main__":
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()

    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set.")
        print("   Option 1: export ANTHROPIC_API_KEY=sk-ant-...")
        print("   Option 2: add ANTHROPIC_API_KEY=sk-ant-... to ~/siempre-swarm/.env")
        print("   Option 3: in Claude Code, run: ! export ANTHROPIC_API_KEY=<key> && python3 scripts/tn-market-agent-setup.py")
        import sys; sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    env_id = get_or_create_environment(client)
    agent_id, agent_version = create_tn_agent(client)

    # Persist to local .env in swarm root
    env_file = REPO_ROOT / ".env"
    existing = env_file.read_text() if env_file.exists() else ""

    lines = [l for l in existing.splitlines() if not l.startswith("TN_AGENT_") and not l.startswith("TN_ENV_")]
    lines += [
        f"TN_AGENT_ID={agent_id}",
        f"TN_AGENT_VERSION={agent_version}",
        f"TN_ENV_ID={env_id}",
    ]
    env_file.write_text("\n".join(lines) + "\n")
    print(f"\n✅ IDs written to {env_file}")
