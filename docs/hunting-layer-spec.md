# Hunting Layer — Agent Spec
> Prospecting new accounts and pursuing new listings across Siempre markets.
> Version: 1.0 | Status: SPEC | Author: Claude (Solace) | Date: 2026-04-11

---

## Overview

The Hunting Layer is a **date-scoped, market-visit-driven** tier that sits between the Market Agents (analysis) and the Sales Director (synthesis). Where Market Agents track what exists, Hunting Agents pursue what doesn't — new on-premise placements, new off-premise listings, and new distributor-pushed accounts.

Each Hunting Agent owns a single **market × week window**. It is instantiated, runs its pipeline, produces a structured result, and terminates. No agent holds persistent state beyond its output record.

---

## Agent Count Estimate

| Agent Type | Count | Lifecycle |
|---|---|---|
| Hunt Window Agents (Stratum I) | Up to 20 concurrent | Ephemeral — one per market × week |
| Hunting Coordinator (Stratum III) | 1 | Persistent — orchestrates and synthesizes |
| **Total active at peak** | **~21** | — |

Realistically, 3–6 Hunt Window Agents run at a time based on which markets have field visits scheduled.

---

## Agent Signatures

### Hunt Window Agent
```
name:       {Market} Hunt — Week of {Date}
            Example: "TX Hunt — Week of Apr 14"
model:      Haiku (Stratum I) — qualification and drafting
            Sonnet (Stratum II) — complex outreach or chain negotiation logic
stratum:    I (standard) / II (elevated, for chain or franchise accounts)
department: sales

inputs:
  - market_code: string (e.g. "TX")
  - visit_window: { start: ISO date, end: ISO date }
  - distributor_rep: { name, email, phone, territory }
  - account_list: AccountTarget[]   — from master contacts DB, filtered to territory
  - target_account_types: ("on-prem" | "chain" | "independent")[]
  - existing_accounts: string[]     — IDs already in CRM; used for dedup
  - sku_targets: string[]           — which SKUs to push this cycle

outputs:
  HuntingResult[]   — see Output Schema below
  summary: {
    accounts_qualified: number,
    outreach_drafts_created: number,
    listings_confirmed: number,
    rep_briefing_sent: boolean
  }
```

### Hunting Coordinator
```
name:       Hunting Coordinator
model:      Sonnet (Stratum III)
stratum:    III — cross-window synthesis, rep scheduling, escalation to Sales Director
department: sales

inputs:
  - active_hunt_windows: HuntWindowContext[]
  - completed_results: HuntingResult[]
  - sales_director_queue: escalation channel

outputs:
  - weekly_hunt_rollup: { market, accounts_pursued, confirmed, pipeline }
  - escalations to Sales Director
  - MailChimp campaign batches (queued, not sent — Maton executes)
```

---

## Pipeline Stage Definitions

```
[Lead Source] → [Qualification] → [Rep Briefing] → [Outreach Draft] → [Follow-up Cadence] → [Listing Confirmed]
```

### Stage 1 — Lead Source
**What:** Pull the raw account list for the market × week window from master contacts DB.
**Inputs:** market_code, target_account_types, existing_accounts (dedup list)
**Actions:**
- Query master contacts DB filtered by: state, account type, no existing listing
- Remove any account already in CRM (dedup by account_id or address match)
- Segment into: on-premise (bars/restaurants), chain (retail/grocery), independent (bottle shops)
**Output:** `raw_leads: AccountTarget[]` — deduplicated, typed, sorted by priority tier

### Stage 2 — Qualification
**What:** Score each lead for hunting fit this cycle.
**Inputs:** raw_leads, sku_targets, market dossier (via Sales Agent context)
**Scoring factors (0–10 per factor):**
- Volume potential (est. case velocity for account type)
- Competitive presence (are competitors listed? — signals category acceptance)
- Rep relationship (does our dist rep have a contact at this account?)
- Account tier (flagship venue vs. neighborhood bar)
**Threshold:** Score ≥ 6 advances to Rep Briefing. Below 6 → logged as `deferred`.
**Output:** `qualified_leads: QualifiedLead[]` (score, tier, reason)

### Stage 3 — Rep Briefing
**What:** Produce a briefing doc for the distributor rep covering this week's target accounts.
**Inputs:** qualified_leads, distributor_rep contact, sku_targets
**Format:** Bulleted one-pager per rep:
- Account name, address, type
- Why we're targeting it this week (volume, competitive gap, visit timing)
- SKU recommendation per account
- Conversation starter / angle
**Delivery:** Queued as Maton send to rep — NOT sent by agent directly (comms firewall enforced). Agent outputs `RECOMMENDED ACTION: Send rep briefing to [rep name] at [email]`.
**Output:** `rep_briefing_doc: string`, `recommended_send: MailAction`

### Stage 4 — Outreach Draft
**What:** Draft account-level outreach for accounts where direct brand contact is appropriate (chain buyers, key on-prem decision-makers).
**Inputs:** qualified_leads (filtered to direct-contact eligible), rep_briefing_doc
**Rules:**
- Follow `feedback_distributor_email_pattern.md`: body = relational, numbers in attachment
- No invented promo mechanics (see `feedback_no_hallucinated_mechanics.md`)
- All drafts routed through Maton — NOT sent by agent
- MailChimp batch drafts for large account lists (>10 accounts same type)
**Output:** `outreach_drafts: OutreachDraft[]`, each with `recommended_send: MailAction`

### Stage 5 — Follow-up Cadence
**What:** Define the follow-up schedule for each outreached account.
**Inputs:** outreach_drafts (with send dates), account tier
**Cadence rules:**
- On-prem: follow up D+7 if no response, D+14 final
- Chain: follow up D+14 (buyer cycle), D+28 final
- Independent: follow up D+5, D+10 final
**Output:** `follow_up_schedule: FollowUpEntry[]` — each with: account_id, follow_up_date, assigned_rep, action_type

### Stage 6 — Listing Confirmed
**What:** Record a confirmed listing — a new account agreed to carry Siempre.
**Trigger:** Rep reports back via email/CRM update, parsed by Hunting Coordinator
**Actions:**
- Update master contacts DB: add listing record
- Remove from active hunt queue
- Log outcome in HuntingResult
- Trigger farming handoff: account moves to Farming Layer on first re-order window
**Output:** `confirmed_listing: ListingRecord`

---

## Output Schema — HuntingResult

```typescript
interface HuntingResult {
  hunt_id: string;                // "{market_code}-{week_start}-{account_id}"
  market_code: string;            // e.g. "TX"
  week_start: string;             // ISO date
  account: {
    id: string;
    name: string;
    type: "on-prem" | "chain" | "independent";
    address: string;
    buyer_contact?: string;
  };
  distributor_rep: {
    name: string;
    email: string;
  };
  qualification_score: number;    // 0–40
  qualification_tier: "A" | "B" | "C" | "deferred";
  pipeline_stage: "lead" | "qualified" | "rep_briefed" | "outreached" | "follow_up" | "confirmed" | "lost";
  outreach_sent_date?: string;    // ISO date — populated by Maton after send
  follow_up_dates: string[];      // ISO dates scheduled
  outcome: "confirmed" | "deferred" | "lost" | "pending";
  sku_confirmed?: string[];       // SKUs the account agreed to list
  next_action: string;            // Human-readable next step
  next_action_date?: string;      // ISO date
  notes: string;
  created_at: string;             // ISO datetime
  updated_at: string;             // ISO datetime
}
```

---

## Integration Points

### Master Contacts DB
- **Read:** Stage 1 (Lead Source) — query by state + account type + no existing listing
- **Write:** Stage 6 (Listing Confirmed) — add listing record
- **Dedup logic:** Match on `account_id` first, fallback to address normalization
- **File:** `data/sales-force/contacts/master-directory.md` (current) → structured DB query when migrated

### MailChimp (Batch Outreach)
- Used for: chain buyer campaigns (Stage 4), multi-account independent blasts
- NOT used for: individual distributor rep briefings (those go via Maton direct)
- Batching rule: ≥5 accounts of same type in same market → MailChimp campaign
- Agent produces campaign spec; Maton executes the MailChimp API call
- Campaign naming: `{market_code}-{account_type}-{week_start}` (e.g. `TX-on-prem-2026-04-14`)

### Maton AI Gateway
- **Prime route for ALL email sends.** No agent sends directly.
- Agents produce `MailAction` objects (to, subject, body, send_after)
- Coordinator batches and passes to Maton via `POST /send`
- Maton gateway keys live on Optimus — see `reference_maton_gateway.md`

### Sales Department (sales-department.ts)
See section below.

---

## How This Plugs Into sales-department.ts

### Routing Addition
Add `'hunt'` task type to `classifySalesTask()` in `sales-pipeline.ts`:
```typescript
if (lower.includes('prospect') || lower.includes('new account') ||
    lower.includes('new listing') || lower.includes('hunt'))
  return 'hunt';
```

### New Pipeline Stages
The hunting pipeline runs **parallel to** (not inside) the existing 6-stage analysis pipeline. It is triggered by:
1. Alex requesting a hunt cycle: `"Run the TX hunt for week of Apr 14"`
2. Hunting Coordinator detecting a scheduled market visit window

### Agent Registration
Hunt Window Agents are **ephemeral** and not pre-registered in the `salesDepartment.agents[]` array. They are spawned by the Hunting Coordinator on demand using the `createHuntWindowAgent(marketCode, weekStart)` factory pattern — mirroring `createMarketAgent()`.

### Director Integration
After a hunt cycle closes, the Hunting Coordinator sends a `hunt_rollup` to the Sales Director. The Sales Director incorporates it into the next weekly scorecard under:
```
NEW ACCOUNTS PIPELINE: {market} — {n} qualified, {n} outreached, {n} confirmed this week
```

### Comms Firewall
The existing `COMMS_FIREWALL` constant from `sales-department.ts` is injected verbatim into every Hunt Window Agent system prompt. Hunt agents follow the same `RECOMMENDED ACTION:` output pattern — they never send email directly.

### Data Flow
```
Master Contacts DB
       ↓
Hunt Window Agent (per market × week)
       ↓ HuntingResult[]
Hunting Coordinator
       ↓ hunt_rollup
Sales Director
       ↓
Executive Briefing (Alex)
       + Maton (email sends)
       + MailChimp (batch campaigns)
```

---

## Model Tier Summary

| Agent | Model | Stratum | Rationale |
|---|---|---|---|
| Hunt Window Agent (standard) | Haiku | I | High volume, simple qualification logic |
| Hunt Window Agent (chain/franchise) | Sonnet | II | Buyer negotiation complexity |
| Hunting Coordinator | Sonnet | III | Cross-window synthesis, rep scheduling |

---

## Open Questions for Alex

1. Should Hunt Window Agents pull account lists from the master contacts DB directly, or does a human (Nick/Rick/AK) pre-filter the list before each hunt cycle?
2. **RESOLVED 2026-04-12:** MailChimp is NOT on Maton. Requires new direct API integration. Gated on Job 9 (Rick skills discovery — Rick likely has the MailChimp key). Job 16 = new integration, not a Maton connector.
3. **RESOLVED 2026-04-12:** Chain account drafts go to the distributor's chain team AND buyer directly — CC everybody (full Siempre team in copy). Alex confirmed: "theoretically, with everybody in copy."
4. **RESOLVED 2026-04-12:** Farming handoff is NOT automatic. Requires: (a) sale confirmed in depletion/shipment data, (b) documented for human approval, (c) batch approval list generated for Alex to review. Only after approval does account move to Farming Layer. Rationale: "needs to be tested before we trust it."
