# CIO — Chief Information Officer Agent
## Siempre Swarm Intelligence Layer

### What It Is
An always-on Opus-powered service on Optimus that serves as the single source of truth
for all sessions, agents, and platforms across Siempre's AI infrastructure.

### The Problem It Solves
Every new Claude session starts cold. Memory files are passive — they only help if the
session knows to look. Alex ends up being the CIO himself, pushing context between
sessions, correcting assumptions, re-teaching things. That doesn't scale.

### Two Operations, Every Session, No Exceptions

**1. REPORT (POST /cio/report)**
Called at session end (or mid-session for important events).
```json
{
  "session_id": "claude-code-2026-04-06-001",
  "platform": "claude-code",         // claude-code | co-work | chat | optimus | swarm
  "device": "macbook",               // macbook | optimus | phone
  "agent": "solace",                 // solace | rook | pepe | swarm-agent-id
  "timestamp": "2026-04-06T15:00:00Z",
  "events": [
    {
      "type": "decision",            // decision | discovery | correction | blocker | completion
      "summary": "Dashboard v3 shipped with email-mined pipeline tracker",
      "details": "Added pipeline_items table, seeded 7 items from Gmail mining...",
      "tags": ["dashboard", "pipeline", "gmail"],
      "importance": 8                // 1-10 scale
    }
  ],
  "context_updates": [
    {
      "key": "dashboard_version",
      "value": "v3",
      "previous": "v2"
    }
  ]
}
```

**2. QUERY (POST /cio/query)**
Called at session start, or anytime an agent needs context.
```json
{
  "session_id": "claude-code-2026-04-06-002",
  "platform": "claude-code",
  "agent": "solace",
  "query": "What's the current state of the demand dashboard?",
  "tags": ["dashboard"],             // optional: narrow the search
  "max_results": 5
}
```

Response:
```json
{
  "answer": "Dashboard v3 was shipped today (2026-04-06). Key changes: ...",
  "sources": [
    {"session": "claude-code-2026-04-06-001", "event": "Dashboard v3 shipped..."},
    {"memory": "project_data_vault.md", "relevance": 0.92}
  ],
  "related_context": [
    "Pipeline has 7 tracked items (2,881 cases)",
    "Beechwood Wisconsin added as source #12 today",
    "Canada RoS: BC=50/mo, AB=147/mo"
  ],
  "stale_warnings": []               // flags if any source info might be outdated
}
```

### Additional Endpoints

**GET /cio/briefing**
Morning briefing — what happened overnight, what's pending, what needs attention.

**GET /cio/status**
Health check — is the CIO running, how many events stored, last report time.

**POST /cio/correct**
Alex (or Solace) corrects a piece of knowledge. The CIO updates its understanding
and flags the correction for future sessions that might have stale info.

**GET /cio/timeline?days=7**
Chronological view of all events across all sessions/platforms.

### Architecture

```
┌─────────────────────────────────────────┐
│           CIO Service (Optimus)          │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ REST API │  │  Opus    │  │ Memory │ │
│  │ (Express)│→ │ Reasoner │→ │ SQLite │ │
│  │ port 8100│  │ (OpenRtr)│  │ + FTS5 │ │
│  └──────────┘  └──────────┘  └────────┘ │
│                      ↕                   │
│              ┌──────────────┐            │
│              │ Memory Files │            │
│              │ (~/.claude/  │            │
│              │  memory/)    │            │
│              └──────────────┘            │
└─────────────────────────────────────────┘
         ↑               ↑            ↑
    Claude Code      Co-work       Swarm Agents
    (laptop)         (any)         (Rook, Pepe, etc.)
```

### Data Model

**events table** — every report from every session
```sql
CREATE TABLE cio_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    device TEXT,
    agent TEXT,
    event_type TEXT NOT NULL,     -- decision, discovery, correction, blocker, completion
    summary TEXT NOT NULL,
    details TEXT,
    tags TEXT,                    -- JSON array
    importance INTEGER DEFAULT 5,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

**context table** — current state of key facts (updated by reports)
```sql
CREATE TABLE cio_context (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by TEXT,              -- session_id that last updated this
    updated_at TEXT NOT NULL,
    history TEXT                  -- JSON array of previous values
);
```

**corrections table** — explicit corrections from Alex/Solace
```sql
CREATE TABLE cio_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wrong_claim TEXT NOT NULL,
    correct_info TEXT NOT NULL,
    corrected_by TEXT,
    timestamp TEXT NOT NULL,
    applied_to TEXT               -- JSON array of session_ids notified
);
```

### Integration Points

1. **Claude Code hooks** — session-start and session-end hooks that auto-report/query
2. **Swarm orchestrator** — modify orchestrator.ts to query CIO before task routing
3. **Pepe digests** — Pepe's email digests write to CIO as discovery events
4. **Rook/OpenClaw** — Rook queries CIO for context before taking action
5. **Memory files** — CIO reads existing ~/.claude/ memory files as a source
6. **CLAUDE.md** — Add CIO query instruction to global CLAUDE.md

### Model Selection
- **Opus** for query answering (needs judgment, synthesis, nuance)
- **Haiku** for event classification and tagging (fast, cheap)
- All via OpenRouter

### Port: 8100 (Tailscale-accessible from laptop)
### Process: launchd managed on Optimus (like vault_api, pepe-agent)
