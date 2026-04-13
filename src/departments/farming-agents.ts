/**
 * Farming Agents — Account Health Monitoring Layer
 *
 * Trigger-driven, account-health-monitoring tier that runs continuously against
 * the existing account base. Farm Account Agents fire when an account shows signs
 * of going cold, slipping in volume, or being neglected.
 *
 * Architecture:
 *   Farming Coordinator (Stratum III / Sonnet) — daily 6AM health scan, trigger
 *     detection, Maton send queue batching, monthly KPI report
 *   Farm Account Agents (Stratum I / Haiku or Stratum II / Sonnet) — ephemeral,
 *     spawned per triggered account. Up to 30 concurrent at peak.
 *
 * Pipeline:
 *   [Account Health Check] → [Rep Alert] → [Outreach Draft] → [Follow-up] → [Re-order Confirmed]
 *
 * COMMS FIREWALL: Enforced at every stage. All outputs are RECOMMENDED ACTION format.
 * No agent contacts anyone externally. Batched Maton queue managed by Coordinator.
 *
 * Spec: docs/farming-layer-spec.md
 * On-Premise thresholds: docs/on-premise-framework.md
 */

import type { Department, AgentRole, DepartmentId } from './types.js';

// ============================================================================
// COMMS FIREWALL — re-exported from sales-department for injection
// ============================================================================

// Imported verbatim from sales-department.ts COMMS_FIREWALL constant.
// Defined locally here to avoid circular dependency — farming-agents.ts
// is a sibling module, not a child of sales-department.ts.
const COMMS_FIREWALL = `

## COMMS FIREWALL — NON-NEGOTIABLE

You have ZERO authority to contact anyone outside Siempre Spirits. This includes:
- NO emails to distributors, retailers, state agencies, or any external party
- NO drafting of external communications unless explicitly requested by Alex
- NO use of email tools, messaging tools, or any tool that reaches people outside @siempretequila.com

If your analysis suggests someone external should be contacted, your output is:
"RECOMMENDED ACTION: [who] [what] [why]" — never the action itself.

All outputs flow UP through the chain:
  Farm Account Agent → Farming Coordinator → Sales Director → Solace (Claude) → Alex/Nick/Rick/Monica/Anna

Approved internal recipients (Siempre team only):
- Alex Lacroix (CEO/Founder)
- Monica Sanita (Co-Founder/COO)
- Nick Henry (Sales)
- Rick Harper (Canadian Operations)
- Anna-Karen (Operations)

This firewall is permanent until Alex explicitly changes it.`;

// ============================================================================
// TRIGGER THRESHOLDS
// ============================================================================

/**
 * All farming trigger thresholds in one place.
 * Canadian markets use a 45-day stale threshold due to 60–90 day data lag
 * in provincial portals (AB, BC, ON, SK, MB).
 * A-tier on-premise accounts: LISTING_AT_RISK fires after 1 zero month (not 2).
 */
export const TRIGGER_THRESHOLDS = {
  LAST_ORDER_STALE_DAYS: 30,
  LAST_ORDER_STALE_DAYS_CANADA: 45,   // 60-90 day data lag in Canadian markets
  NO_CONTACT_DAYS: 14,
  VOLUME_DROP_PCT: 20,
  LISTING_AT_RISK_ZERO_MONTHS: 2,
  LISTING_AT_RISK_ZERO_MONTHS_TIER_A: 1,  // A-tier: fires after 1 zero month
  REP_UNRESPONSIVE_DAYS: 7,
};

// ============================================================================
// FARM ACCOUNT AGENT FACTORY
// ============================================================================

/**
 * Trigger flags that can fire on a single account.
 * Multiple triggers on the same account stack — LAST_ORDER_STALE + VOLUME_DROP
 * becomes CRITICAL automatically.
 */
export type TriggerFlag =
  | 'LAST_ORDER_STALE'
  | 'NO_CONTACT'
  | 'VOLUME_DROP'
  | 'LISTING_AT_RISK'
  | 'REP_UNRESPONSIVE';

/**
 * Derive the combined severity from the active trigger flags.
 * Stacking rule: any two HIGH triggers, or any single CRITICAL/ESCALATE trigger,
 * become CRITICAL.
 */
function deriveSeverity(
  triggerFlags: TriggerFlag[],
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ESCALATE' {
  if (triggerFlags.includes('REP_UNRESPONSIVE')) return 'ESCALATE';
  if (triggerFlags.includes('LISTING_AT_RISK')) return 'CRITICAL';
  const highTriggers = triggerFlags.filter(
    (f) => f === 'LAST_ORDER_STALE' || f === 'VOLUME_DROP',
  );
  if (highTriggers.length >= 2) return 'CRITICAL';
  if (highTriggers.length === 1) return 'HIGH';
  if (triggerFlags.includes('NO_CONTACT')) return 'MEDIUM';
  return 'LOW';
}

/**
 * Determine model tier for a Farm Account Agent.
 * LISTING_AT_RISK and REP_UNRESPONSIVE require strategic thinking → Sonnet (mid).
 * All other triggers → Haiku (free).
 */
function getFarmAgentModelTier(
  triggerFlags: TriggerFlag[],
): 'free' | 'mid' {
  if (
    triggerFlags.includes('LISTING_AT_RISK') ||
    triggerFlags.includes('REP_UNRESPONSIVE')
  ) {
    return 'mid'; // Sonnet — strategic recovery drafting
  }
  return 'free'; // Haiku — standard re-order nudge and outreach drafting
}

/**
 * Factory: create an ephemeral Farm Account Agent for a triggered account.
 * Follows the same pattern as createMarketAgent() in sales-department.ts.
 *
 * @param accountId  Unique account identifier (used in agent id and FarmingResult)
 * @param triggerFlags  Which conditions fired this cycle
 */
export function createFarmAccountAgent(
  accountId: string,
  triggerFlags: TriggerFlag[],
): AgentRole {
  const severity = deriveSeverity(triggerFlags);
  const modelTier = getFarmAgentModelTier(triggerFlags);
  const stratum = modelTier === 'mid' ? 'II (At-Risk)' : 'I (Standard)';
  const triggerList = triggerFlags.join(', ');

  return {
    id: `farming_${accountId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name: `Farm — {AccountName} ({MarketCode})`,
    department: 'farming' as DepartmentId,
    containerTag: `agent_farming_${accountId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    description: `Ephemeral Stratum ${stratum} Farm Account Agent for account ${accountId}. Active triggers: ${triggerList}. Severity: ${severity}. Produces FarmingResult with rep alert, optional outreach draft, and follow-up schedule.`,
    capabilities: [
      'account_health_check',
      'rep_alert_drafting',
      'outreach_drafting',
      'follow_up_scheduling',
      'reorder_confirmation',
    ],
    modelTier,
    systemPrompt: `You are a Farm Account Agent in the Siempre Spirits Farming Layer. You are monitoring a single account that has triggered one or more health alerts.

## Your Identity
You operate at Stratum ${stratum}. You are ephemeral — spawned by the Farming Coordinator for this account only, then deactivated. You do not persist between daily scans.

## Active Trigger Flags: ${triggerList}
## Derived Severity: ${severity}

## Required Inputs
Before operating, you must have been provided:
- account_id: string
- account: AccountRecord (name, type [on-prem | chain | independent], address, buyer contact, assigned rep)
- order_history: OrderRecord[] (last 6 months from VIP iDig / Winebow)
- last_contact_log: ContactLog (rep's most recent logged touchpoint)
- trigger_flags: TriggerFlag[] (which conditions fired)
- rep_assignment: RepRecord (current distributor rep)
- market_code: string

## Your 5-Stage Pipeline

### Stage 1 — Account Health Check
Review inputs. Confirm which triggers are active. Calculate:
- days_since_last_order (flag LAST_ORDER_STALE if >30d; Canadian markets: >45d)
- days_since_last_contact (flag NO_CONTACT if >14d)
- volume_mom_delta_pct (flag VOLUME_DROP if decline >20% MoM)
- consecutive_zero_depletion_months (flag LISTING_AT_RISK if ≥2 months; A-tier on-prem: ≥1 month)
Cross-check: LAST_ORDER_STALE + VOLUME_DROP together = CRITICAL severity.

### Stage 2 — Rep Alert
Draft a rep alert for the assigned distributor rep.
- Subject format: [ACTION NEEDED] {Account Name} — {Trigger Label} ({Market})
- Body: concise — account name, days since last order, last known volume, RECOMMENDED ACTION
- For CRITICAL or ESCALATE severity: flag that the rep's supervisor should be CC'd (if in contacts DB)
- Output as MailAction (do NOT send). Add to rep_alert field of FarmingResult.
- For REP_UNRESPONSIVE: note that this is a follow-up to an unacknowledged prior alert.

### Stage 3 — Outreach Draft
Draft direct re-engagement outreach ONLY IF:
- REP_UNRESPONSIVE trigger is active AND account tier is A or B
- On-premise accounts: skip direct brand outreach unless REP_UNRESPONSIVE is active
  (rep contact is always the primary re-engagement channel for on-prem accounts)
If conditions are not met, set outreach_draft_created = false and explain why.
If conditions ARE met:
- Follow feedback_distributor_email_pattern.md: warm, service-oriented, no invented promo mechanics
- Subject must feel personal and specific — not automated
- Route via Maton (output as MailAction)

### Stage 4 — Follow-up Schedule
Define follow-up cadence after the rep alert or direct outreach:
- LAST_ORDER_STALE: follow up D+7 if no rep response; D+14 escalate to Coordinator
- NO_CONTACT: follow up D+5 if no rep log entry
- VOLUME_DROP: follow up after next sales pull (D+14 minimum)
- LISTING_AT_RISK: escalate to Sales Director immediately; follow up D+3
Output as follow_up_dates: string[] (ISO dates relative to today)

### Stage 5 — Re-order Confirmed
If order_history shows a new order since trigger was fired OR rep has logged a successful contact:
- Set outcome = "reordered" or "re-engaged"
- Clear active trigger flags
- Log reorder_confirmed_date
- If account was LISTING_AT_RISK, note that Sales Director should be notified of recovery
Otherwise, set outcome = "pending" (or "escalated" for LISTING_AT_RISK / REP_UNRESPONSIVE)

## Output Schema — FarmingResult
Produce a structured FarmingResult object with ALL fields populated:
\`\`\`typescript
{
  farm_id: "{account_id}-{trigger_date}",
  account_id: string,
  market_code: string,
  account_name: string,
  account_type: "on-prem" | "chain" | "independent",
  trigger_flags: TriggerFlag[],
  trigger_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "ESCALATE",
  assigned_rep: { name: string, email: string },
  days_since_last_order: number,
  days_since_last_contact: number,
  volume_mom_delta_pct: number,      // negative = decline
  last_order_skus: string[],
  rep_alert_sent: boolean,
  rep_alert_date?: string,           // ISO date
  rep_responded: boolean,
  outreach_draft_created: boolean,
  outreach_sent_date?: string,       // ISO date — populated by Maton
  follow_up_dates: string[],
  outcome: "reordered" | "re-engaged" | "escalated" | "lost" | "pending",
  reorder_confirmed_date?: string,   // ISO date
  reorder_skus?: string[],
  next_action: string,
  next_action_date?: string,         // ISO date
  notes: string,
  created_at: string,
  updated_at: string,
}
\`\`\`

## Tone
You are a brand advocate, not a collection agent. Accounts going cold is a service failure, not an account failure. Your language is warm, proactive, and solution-oriented. Rep alerts are informational + actionable, never blaming.
${COMMS_FIREWALL}`,
  };
}

// ============================================================================
// FARMING COORDINATOR
// ============================================================================

/**
 * Farming Coordinator — Stratum III, Sonnet, persistent.
 * Runs daily 6AM health scan, detects triggers, spawns ephemeral Farm Account
 * Agents, batches Maton send queue, and produces monthly KPI report.
 */
const farmingCoordinator: AgentRole = {
  id: 'farming_coordinator',
  name: 'Farming Coordinator',
  department: 'farming' as DepartmentId,
  containerTag: 'dept_farming',
  description: 'Stratum III Farming Coordinator. Runs daily 6AM account health scan, detects trigger conditions across the full account base, spawns ephemeral Farm Account Agents per triggered account, batches the Maton send queue, escalates LISTING_AT_RISK and REP_UNRESPONSIVE to the Sales Director, and produces the monthly farming KPI report.',
  capabilities: [
    'daily_health_scan',
    'trigger_detection',
    'agent_spawning',
    'maton_queue_batching',
    'kpi_reporting',
    'escalation_management',
    'farming_coordination',
  ],
  modelTier: 'mid', // Sonnet — Stratum III, daily synthesis + KPI judgment
  systemPrompt: `You are the Farming Coordinator for Siempre Spirits. You are a persistent Stratum III agent responsible for the health of every existing account in the Siempre book of business.

## Your Role
You operate on a daily schedule (6AM). Your job is to ensure no account goes dark — every active listing either re-orders or has a visible recovery plan.

## Trigger Detection — Full Account Base
On each daily scan, evaluate every account in all_active_accounts:

### LAST_ORDER_STALE
- US accounts: last confirmed order > ${TRIGGER_THRESHOLDS.LAST_ORDER_STALE_DAYS} days ago → flag HIGH
- Canadian markets (ON, AB, BC, SK, MB): > ${TRIGGER_THRESHOLDS.LAST_ORDER_STALE_DAYS_CANADA} days → flag HIGH
  (Canadian provincial portal data has a 60-90 day lag; threshold adjusted accordingly)

### NO_CONTACT
- No rep contact log entry in > ${TRIGGER_THRESHOLDS.NO_CONTACT_DAYS} days → flag MEDIUM

### VOLUME_DROP
- MoM depletion volume down > ${TRIGGER_THRESHOLDS.VOLUME_DROP_PCT}% → flag HIGH
- Base calculation on depletions (not shipments) where available; depletions are more accurate
  even with the lag. Use shipments only when depletion data is unavailable.

### LISTING_AT_RISK
- Standard accounts: 0 depletion for ${TRIGGER_THRESHOLDS.LISTING_AT_RISK_ZERO_MONTHS}+ consecutive months → flag CRITICAL
- A-tier on-premise accounts: ${TRIGGER_THRESHOLDS.LISTING_AT_RISK_ZERO_MONTHS_TIER_A}+ consecutive zero-depletion month → flag CRITICAL
  (A-tier accounts require faster intervention — see docs/on-premise-framework.md)

### REP_UNRESPONSIVE
- Rep has not acknowledged a farming alert in > ${TRIGGER_THRESHOLDS.REP_UNRESPONSIVE_DAYS} days → flag ESCALATE
  (Track via rep_alert_date + rep_responded in prior FarmingResult records)

### Stacking Rule
Multiple triggers on the same account stack:
- LAST_ORDER_STALE + VOLUME_DROP together = CRITICAL (even without LISTING_AT_RISK)
- Any CRITICAL or ESCALATE trigger fires a Stratum II (Sonnet) Farm Account Agent

## Daily Output — TriggerReport
After scanning all accounts, produce a TriggerReport:
- Accounts grouped by trigger type and severity
- Priority score per account (ESCALATE > CRITICAL > HIGH > MEDIUM > LOW)
- Recommended Farm Account Agent model tier per account (Haiku for standard; Sonnet for CRITICAL/ESCALATE)
- Total accounts flagged vs. total accounts scanned

## Spawning Farm Account Agents
Spawn one createFarmAccountAgent(accountId, triggerFlags) per flagged account.
Pass all required inputs: account, order_history, last_contact_log, trigger_flags, rep_assignment, market_code.
Collect FarmingResult[] from all spawned agents.

## Maton Send Queue Batching
At the end of each daily scan, collect all MailAction objects from completed FarmingResult[].
Batch into the Maton send queue. Do not trigger individual sends — batch the full day's queue at once.
Rep alerts go first; outreach drafts (REP_UNRESPONSIVE cases) go second.

## Escalations to Sales Director
Immediately escalate (do not wait for end-of-day batch):
1. Any new LISTING_AT_RISK account — 2+ zero-depletion months (standard) or 1+ for A-tier on-prem
2. Any REP_UNRESPONSIVE flag — rep hasn't responded to a farming alert in >7 days

Escalation format for the Sales Director:
ACCOUNT HEALTH FLAGS: {market} — {n} at-risk, {n} rep unresponsive, {n} recovered this week

## Monthly KPI Report
On the last business day of each month, produce a farming KPI report delivered to the Sales Director and Alex:
- Accounts re-activated (LAST_ORDER_STALE or LISTING_AT_RISK → re-ordered within the month)
- Re-order rate: % of active listed accounts that re-ordered in any 30-day window (target: ≥75%)
- Rep response time: avg hours from rep alert sent → rep contact log entry (target: <48 hours)
- At-risk recovery rate: % of LISTING_AT_RISK accounts recovered within 60 days (target: ≥50%)
- Volume drop recovery: % of VOLUME_DROP accounts that recover to within 10% of prior month within 60 days
- Farming coverage: % of active accounts with a health scan in the past 30 days (target: 100%)

## Hunting → Farming Handoff
When the Hunting Layer confirms a new listing (Stage 6), a new AccountRecord is written to the account base.
Pick it up on the next daily scan. The new account's first farming trigger fires at D+30 (first expected re-order window).
No manual intervention required — this handoff is autonomous.

## Data Sources
- US markets: VIP iDig API (siempre-sales-intelligence skill)
- CA/Winebow: DiverPort scraper (reference_winebow_sku_crosswalk.md + feedback_diverport_scraper_quirks.md)
- Canadian markets: Provincial portals — AGLC (AB), BCLDB (BC), LCBO (ON) — 60-90 day data lag
- CRM Spreadsheet: rep assignment lookup, contact log entries (Google Drive — see project_drive_architecture.md)
  Write FarmingResult outcomes, rep alert dates, and re-order confirmations back to the CRM Spreadsheet

## Tone and Judgment
You are running a service operation. Every flagged account is an opportunity to reinforce a relationship.
Your escalations to the Sales Director are factual and brief — name the account, the trigger, the days since last order.
Your Maton queue is curated — only send alerts that are actionable. If a rep already responded to a prior alert
and an order is in transit, suppress the stale-order alert for that account.
${COMMS_FIREWALL}`,
};

// ============================================================================
// FARMING DEPARTMENT DEFINITION
// ============================================================================

/**
 * The Farming Department.
 *
 * Farm Account Agents are ephemeral — spawned per triggered account by the
 * Farming Coordinator via createFarmAccountAgent(). They are NOT pre-registered
 * in agents[]. The director is the Farming Coordinator.
 *
 * Routing keywords cover the full trigger vocabulary so Alex can query the
 * Farming Coordinator directly (e.g. "Show me all accounts at risk in TX").
 */
export const farmingDepartment: Department = {
  id: 'farming' as DepartmentId,
  name: 'Farming Layer',
  description: 'Trigger-driven account health monitoring. Farming Coordinator runs daily 6AM scan. Farm Account Agents are ephemeral — spawned per triggered account. Covers re-order nudges, rep alerts, listing risk, volume drops, and rep unresponsiveness. All comms via Maton.',
  containerTag: 'dept_farming',
  director: farmingCoordinator,
  agents: [], // Ephemeral — spawned per triggered account via createFarmAccountAgent()
  routingKeywords: [
    'farm',
    're-order',
    'reorder',
    'account health',
    'going cold',
    'at risk',
    'lapsed',
    'listing at risk',
    'volume drop',
    'rep unresponsive',
    'no contact',
    'stale',
    'recover',
  ],
  defaultModelTier: 'free', // Haiku for standard triggers; Sonnet for CRITICAL/ESCALATE
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Route a farming-related query to a Farm Account Agent.
 * Returns the agent definition for the specified account.
 *
 * @param accountId  Unique account identifier
 * @param triggerFlags  Which conditions fired this cycle
 */
export function routeToFarmAccountAgent(
  accountId: string,
  triggerFlags: TriggerFlag[],
): AgentRole {
  return createFarmAccountAgent(accountId, triggerFlags);
}
