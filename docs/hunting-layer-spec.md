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
[Account Prep] → [State Validation] → [Lead Source] → [Qualification] → [Rep Briefing] → [Outreach Draft] → [Follow-up Cadence] → [Listing Confirmed]
```

### Pre-Stage — Account Preparation (Managed Agent, runs before Hunt Window Agent spawns)

**What:** A managed agent reads the master contacts DB, filters to the territory, and writes a clean account CSV to the state folder. The existing State Agent (market agent) then validates the list before the Hunt Window Agent is spawned.

**Who runs this:** Hunting Coordinator triggers a managed SDK agent (NOT the Hunt Window Agent itself). This is pre-hunt infrastructure, not part of the hunt pipeline.

**Actions:**
1. Managed agent reads `data/sales-force/contacts/master-directory.md` (or contacts DB)
2. Filters to: `market_code`, `account_type IN (on-prem, chain, independent)`, excludes accounts already in master_sales with active Siempre listing
3. Writes output to: `data/sales-force/hunt-queue/{STATE_CODE}/accounts-{YYYY-MM-DD}.csv`
4. State Agent (existing market agent for that state) reads the CSV, validates completeness and correctness:
   - Flags closed/inactive accounts it knows about
   - Flags accounts already in an open relationship (rep intel it holds)
   - Confirms account type classifications
   - Returns: `validated_accounts.csv` (same path, `_validated` suffix) + `validation_notes.md`
5. Hunting Coordinator reads validated list → spawns Hunt Window Agent with it as input

**State folder naming convention:**
```
data/sales-force/hunt-queue/
  {STATE_CODE}/
    accounts-{YYYY-MM-DD}.csv          ← managed agent output (raw)
    accounts-{YYYY-MM-DD}_validated.csv ← state agent output (clean)
    validation-{YYYY-MM-DD}.md         ← state agent notes + flags
```

**Example:** `data/sales-force/hunt-queue/CO/accounts-2026-04-13.csv`

**Why this way:**
- Hunt Window Agents receive clean, validated data — they focus on qualification and outreach, not data hygiene
- State Agent validation uses market-specific knowledge the Hunt Window Agent doesn't have
- The CSV is a persistent audit trail — you can see exactly what account list fed any hunt cycle
- Pre-filtering is done once, not inside every agent call

---

### Stage 1 — Lead Source
**What:** Hunt Window Agent reads the pre-validated account list from the state folder. No direct DB query.
**Inputs:** `validated_accounts.csv` from `data/sales-force/hunt-queue/{STATE_CODE}/accounts-{week_start}_validated.csv`, plus `validation_notes.md`
**Actions:**
- Load validated account list (already deduplicated, typed, territory-filtered)
- Review any flags from validation notes — escalate CRITICAL flags to Hunting Coordinator before proceeding
- Segment final list into: on-premise (A/B/C tier), chain (→ Tier X routing), independent
**Output:** `raw_leads: AccountTarget[]` — ready for qualification

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
**What:** Record a confirmed listing and queue it for human approval before handing to the Farming Layer.
**Trigger:** Rep reports back via email/CRM update, parsed by Hunting Coordinator

**Actions:**
1. Hunting Coordinator records the rep's confirmation
2. Waits for depletion confirmation — a real order must appear in VIP iDig or Winebow data for this account (1–4 week lag)
3. Once depletion confirmed, adds account to `data/sales-force/hunt-queue/pending-handoff.json`:
   ```json
   {
     "account": "...", "market": "CO", "sku_confirmed": ["plata"],
     "rep": "...", "listing_confirmed_date": "...",
     "depletion_confirmed": true, "depletion_confirmed_date": "...",
     "status": "PENDING_APPROVAL"
   }
   ```
4. Hunting Coordinator generates **weekly batch approval list** for Alex — accounts ready for Farming Layer handoff
5. Alex reviews and approves (batch or individually)
6. **Only after approval:** master contacts DB updated with listing record, account registered in Farming Layer

**Why human-gated:** Not automatic until we test it and confirm the data pipeline is reliable. After a few cycles of clean approvals, can be promoted to semi-automatic (flag exceptions only).

**Output:** `confirmed_listing: ListingRecord` with `status: "pending_approval"` until Alex approves

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
