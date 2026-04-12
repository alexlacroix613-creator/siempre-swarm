# Farming Layer — Agent Spec
> Maintaining existing accounts, ensuring re-orders, and delivering attentive service.
> Version: 1.0 | Status: SPEC | Author: Claude (Solace) | Date: 2026-04-11

---

## Overview

The Farming Layer is a **trigger-driven, account-health-monitoring** tier that runs continuously against the existing account base. Where Market Agents track distributor and market-level KPIs, Farming Agents operate one level deeper — they watch individual accounts and fire when an account shows signs of going cold, slipping in volume, or being neglected.

The goal is simple: no account goes dark. Every existing listing should either be actively re-ordering or have a visible recovery plan.

---

## Trigger Conditions

A Farming Agent fires on any of the following:

| Trigger | Definition | Priority |
|---|---|---|
| `LAST_ORDER_STALE` | Last confirmed order >30 days ago | HIGH |
| `NO_CONTACT` | No rep contact log entry in >14 days | MEDIUM |
| `VOLUME_DROP` | MoM depletion volume down >20% | HIGH |
| `LISTING_AT_RISK` | Account shows 0 depletion for 2+ consecutive months | CRITICAL |
| `REP_UNRESPONSIVE` | Rep has not acknowledged a farming alert in >7 days | ESCALATE |

Multiple triggers on the same account stack — a `LAST_ORDER_STALE` + `VOLUME_DROP` combo becomes CRITICAL automatically.

---

## Agent Count Estimate

| Agent Type | Count | Lifecycle |
|---|---|---|
| Farm Account Agents (Stratum I) | Up to 30 concurrent | Ephemeral — one per triggered account |
| Farming Coordinator (Stratum III) | 1 | Persistent — health scan, trigger detection, escalation |
| **Total active at peak** | **~31** | — |

The Farming Coordinator runs a **daily health scan** at 6AM. It spawns Farm Account Agents only for accounts with active triggers. Most days this is 5–15 agents; peak (post-holiday, post-promo) may be 25–30.

---

## Agent Signatures

### Farm Account Agent
```
name:       Farm — {Account Name} ({Market Code})
            Example: "Farm — The Rustic Fig Bar (TX)"
model:      Haiku (Stratum I) — standard re-order nudge and outreach drafting
            Sonnet (Stratum II) — LISTING_AT_RISK or volume drop requiring strategy
stratum:    I (standard) / II (elevated, for at-risk accounts)
department: sales

inputs:
  - account_id: string
  - account: AccountRecord        — name, type, address, buyer contact, assigned rep
  - order_history: OrderRecord[]  — last 6 months, from VIP iDig / Winebow data
  - last_contact_log: ContactLog  — rep's most recent logged touchpoint
  - trigger_flags: TriggerFlag[]  — which conditions fired
  - rep_assignment: RepRecord     — current distributor rep for this account
  - market_code: string

outputs:
  FarmingResult   — see Output Schema below
```

### Farming Coordinator
```
name:       Farming Coordinator
model:      Sonnet (Stratum III)
stratum:    III — daily health scan, trigger detection, coordination, KPI rollup
department: sales

inputs:
  - all_active_accounts: AccountRecord[]   — full account base with order history
  - completed_farm_results: FarmingResult[]
  - sales_director_queue: escalation channel

outputs:
  - daily_health_scan: TriggerReport      — accounts by trigger type and priority
  - monthly_farming_kpi_report: KPIReport
  - escalations to Sales Director (REP_UNRESPONSIVE, LISTING_AT_RISK)
  - Maton send queue (batched outreach actions from Farm Account Agents)
```

---

## Pipeline Stage Definitions

```
[Account Health Check] → [Rep Alert] → [Outreach Draft] → [Follow-up] → [Re-order Confirmed]
```

### Stage 1 — Account Health Check
**What:** The Farming Coordinator scans the full account base daily and scores each account.
**Inputs:** order_history (VIP iDig / Winebow), last_contact_log, account metadata
**Actions:**
- Compute days since last order → flag `LAST_ORDER_STALE` if >30
- Compute days since last rep contact → flag `NO_CONTACT` if >14
- Compute MoM volume delta → flag `VOLUME_DROP` if decline >20%
- Check consecutive zero-depletion months → flag `LISTING_AT_RISK` if 2+
**Output:** `trigger_report: TriggerReport` — all flagged accounts with trigger type, severity, and priority score

### Stage 2 — Rep Alert
**What:** Notify the assigned distributor rep about the flagged account.
**Inputs:** trigger_report (one account), rep_assignment, account details
**Alert format:**
- Subject: `[ACTION NEEDED] {Account Name} — {Trigger Label} ({Market})`
- Body: concise — account name, days since last order, last known volume, recommended action
- For CRITICAL/ESCALATE: CC the rep's supervisor (if in contacts DB)
**Delivery:** Queued as `MailAction` for Maton — agent outputs `RECOMMENDED ACTION: Send rep alert to [rep name]`. Not sent directly (comms firewall enforced).
**Output:** `rep_alert: MailAction`, `alert_sent_date` (populated by Maton after send)

### Stage 3 — Outreach Draft
**What:** Draft a re-engagement message for the account buyer/owner (for accounts where direct brand contact is appropriate and rep has been unresponsive).
**Inputs:** account record, order_history, trigger_flags, rep_alert status
**Rules:**
- Only draft direct outreach if: `REP_UNRESPONSIVE` trigger is active AND account tier is A or B
- Follow `feedback_distributor_email_pattern.md` tone: warm, service-oriented
- No invented promo mechanics
- Subject line must not feel automated — personal, specific to the account
- Route via Maton
**Output:** `outreach_draft: OutreachDraft` (or null if rep alert is sufficient)

### Stage 4 — Follow-up
**What:** Define follow-up cadence after initial rep alert or direct outreach.
**Inputs:** rep_alert status, outreach_draft status, account tier, trigger severity
**Cadence:**
- `LAST_ORDER_STALE`: follow up D+7 if no rep response, D+14 escalate to coordinator
- `NO_CONTACT`: follow up D+5 if no rep log entry
- `VOLUME_DROP`: follow up after next sales pull (D+14 min)
- `LISTING_AT_RISK`: escalate to Sales Director immediately; follow up D+3
**Output:** `follow_up_schedule: FollowUpEntry[]`

### Stage 5 — Re-order Confirmed
**What:** Record that the account has re-ordered or re-engagement has succeeded.
**Trigger:** New order record appears in VIP iDig / Winebow for this account (parsed by Coordinator on next daily scan), OR rep logs a successful contact
**Actions:**
- Clear all active trigger flags for this account
- Update `last_contact_log` timestamp
- Log outcome in FarmingResult
- If account was `LISTING_AT_RISK`, notify Sales Director of recovery
**Output:** `reorder_record: ReorderRecord`

---

## Output Schema — FarmingResult

```typescript
interface FarmingResult {
  farm_id: string;                  // "{account_id}-{trigger_date}"
  account_id: string;
  market_code: string;
  account_name: string;
  account_type: "on-prem" | "chain" | "independent";
  trigger_flags: TriggerFlag[];     // which conditions fired this cycle
  trigger_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "ESCALATE";
  assigned_rep: {
    name: string;
    email: string;
  };
  days_since_last_order: number;
  days_since_last_contact: number;
  volume_mom_delta_pct: number;     // negative = decline
  last_order_skus: string[];
  rep_alert_sent: boolean;
  rep_alert_date?: string;          // ISO date
  rep_responded: boolean;
  outreach_draft_created: boolean;
  outreach_sent_date?: string;      // ISO date — populated by Maton
  follow_up_dates: string[];
  outcome: "reordered" | "re-engaged" | "escalated" | "lost" | "pending";
  reorder_confirmed_date?: string;  // ISO date
  reorder_skus?: string[];
  next_action: string;
  next_action_date?: string;        // ISO date
  notes: string;
  created_at: string;
  updated_at: string;
}
```

---

## KPI Definitions

| KPI | Definition | Target |
|---|---|---|
| **Accounts re-activated per month** | Accounts that were `LAST_ORDER_STALE` or `LISTING_AT_RISK` and placed a new order within the month | Track vs. prior month |
| **Re-order rate** | % of active listed accounts that re-ordered in any given 30-day window | Target: ≥75% |
| **Rep response time** | Avg hours from rep alert sent → rep contact log entry recorded | Target: <48 hours |
| **At-risk recovery rate** | % of `LISTING_AT_RISK` accounts recovered (re-order placed within 60 days) | Target: ≥50% |
| **Volume drop recovery** | % of `VOLUME_DROP` accounts that recover to within 10% of prior month within 60 days | Track |
| **Farming coverage** | % of active accounts with a health scan entry in the past 30 days | Target: 100% |

The Farming Coordinator produces a **monthly KPI report** delivered to the Sales Director and Alex.

---

## Integration Points

### VIP iDig / Winebow Sales Data
- **Read:** Stage 1 (Account Health Check) — order history per account per market
- **Polling frequency:** Daily (Farming Coordinator runs at 6AM)
- **US markets:** VIP iDig API — see `siempre-sales-intelligence` skill
- **CA (Winebow):** DiverPort scraper — see `reference_winebow_sku_crosswalk.md` and `feedback_diverport_scraper_quirks.md`
- **Canadian markets:** Provincial portal scrapers (AB: AGLC, BC: BCLDB, ON: LCBO) — 60–90 day data lag; farming triggers adjusted to 45-day order stale threshold for Canadian accounts

### CRM Spreadsheet
- **Read:** Rep assignment lookup, last_contact_log entries
- **Write:** FarmingResult outcomes, rep alert dates, re-order confirmations
- Source of truth for rep-to-account assignments until a formal CRM is deployed
- Current location: Google Drive (see `project_drive_architecture.md` for path)

### Maton AI Gateway
- **All outbound communication flows through Maton.** No agent sends directly.
- Farm Account Agents produce `MailAction` objects
- Farming Coordinator batches into Maton send queue at end of each daily scan
- Rep alerts go via `alex@siempretequila.com` (Alex-approved) or directly via Maton if the rep is a Maton-configured contact
- Gateway keys on Optimus — see `reference_maton_gateway.md`

### Sales Department (sales-department.ts)
See section below.

---

## How This Plugs Into sales-department.ts

### Task Type Addition
Add `'farming_check'` to `classifySalesTask()` in `sales-pipeline.ts`:
```typescript
if (lower.includes('farm') || lower.includes('re-order') || lower.includes('reorder') ||
    lower.includes('account health') || lower.includes('going cold') || lower.includes('at risk'))
  return 'farming_check';
```

### Pipeline Integration Pattern
Farming runs on its **own autonomous schedule** (daily 6AM scan), not triggered by Alex queries. However, Alex can query the Farming Coordinator directly:
- `"Show me all accounts at risk in TX"` → routes to Farming Coordinator
- `"Which accounts haven't re-ordered in 30 days?"` → farming_check task type

### Agent Registration
Farm Account Agents are ephemeral, spawned by the Farming Coordinator via `createFarmAccountAgent(accountId, triggerFlags)` factory — same pattern as `createMarketAgent()` in `sales-department.ts`. They are not pre-registered in `salesDepartment.agents[]`.

### Director Integration
The Farming Coordinator escalates two classes of events to the Sales Director:
1. **LISTING_AT_RISK** accounts — any account with 2+ zero-depletion months
2. **REP_UNRESPONSIVE** — any rep that hasn't responded to a farming alert in >7 days

The Sales Director incorporates farming escalations into the weekly scorecard:
```
ACCOUNT HEALTH FLAGS: {market} — {n} at-risk, {n} rep unresponsive, {n} recovered this week
```

### Hunting → Farming Handoff
When the Hunting Layer confirms a new listing (Stage 6 of hunting pipeline), it writes a new `AccountRecord` to the account base. The Farming Coordinator picks it up on the next daily scan. The new account's first farming trigger fires at D+30 (first expected re-order window). This handoff requires no manual intervention.

### Comms Firewall
The `COMMS_FIREWALL` constant from `sales-department.ts` is injected verbatim into every Farm Account Agent system prompt. All external communication is `RECOMMENDED ACTION:` format only.

### Data Flow
```
VIP iDig / Winebow / Provincial Portals
       ↓ order_history
Farming Coordinator (daily 6AM scan)
       ↓ TriggerReport
Farm Account Agents (ephemeral, per triggered account)
       ↓ FarmingResult[]
Farming Coordinator
       ↓ monthly_kpi_report + escalations
Sales Director
       ↓
Executive Briefing (Alex)
       + Maton (rep alerts + outreach sends)
```

---

## Model Tier Summary

| Agent | Model | Stratum | Rationale |
|---|---|---|---|
| Farm Account Agent (standard) | Haiku | I | High volume, simple alert and draft logic |
| Farm Account Agent (at-risk) | Sonnet | II | LISTING_AT_RISK requires strategic recovery drafting |
| Farming Coordinator | Sonnet | III | Daily scan, KPI synthesis, escalation judgment |

---

## Open Questions for Alex

1. Canadian account farming threshold — given the 60–90 day data lag, should `LAST_ORDER_STALE` be bumped to 45 or 60 days for ON/AB/BC/SK/MB accounts?
2. CRM spreadsheet location — can the Farming Coordinator read/write the rep contact log directly, or does it need to go through Monica?
3. For on-premise accounts (bars/restaurants), rep contact should be the priority re-engagement channel. Should Farming Coordinator skip direct brand outreach entirely for on-prem, even when the rep is unresponsive?
4. Volume drop calculation — should it be based on depletions (what moved off shelf) or shipments (what the distributor bought from us)? Depletions are more accurate but lag by weeks.
