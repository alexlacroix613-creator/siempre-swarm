/**
 * Hunting Layer — Hunt Window Agent Factory + Hunting Coordinator
 *
 * Prospecting new accounts and pursuing new listings across Siempre markets.
 * Agents are EPHEMERAL — one per market × week window. Not pre-registered.
 * The Hunting Coordinator (Stratum III) orchestrates and synthesizes results.
 *
 * Architecture:
 *   Hunt Window Agents (Stratum I/II) — ephemeral, one per market × week
 *     Stratum I / Haiku — standard on-premise and independent accounts
 *     Stratum II / Sonnet — chain/franchise accounts (buyer negotiation complexity)
 *   Hunting Coordinator (Stratum III / Sonnet) — persistent, cross-window synthesis
 *
 * 6-Stage Pipeline:
 *   [Lead Source] → [Qualification] → [Rep Briefing] → [Outreach Draft]
 *     → [Follow-up Cadence] → [Listing Confirmed]
 *
 * Comms firewall enforced on every agent. No agent sends email directly.
 * All outputs use RECOMMENDED ACTION: format.
 *
 * Data lives at: data/sales-force/
 *   contacts/master-directory.md — source for Lead Source (Stage 1)
 */

import type { Department, AgentRole, DepartmentId } from './types.js';

// ============================================================================
// COMMS FIREWALL — Injected verbatim into every agent system prompt
// ============================================================================

const COMMS_FIREWALL = `

## COMMS FIREWALL — NON-NEGOTIABLE

You have ZERO authority to contact anyone outside Siempre Spirits. This includes:
- NO emails to distributors, retailers, state agencies, or any external party
- NO drafting of external communications unless explicitly requested by Alex
- NO use of email tools, messaging tools, or any tool that reaches people outside @siempretequila.com

If your analysis suggests someone external should be contacted, your output is:
"RECOMMENDED ACTION: [who] [what] [why]" — never the action itself.

All outputs flow UP through the chain:
  Market Agent → Sales Director → Solace (Claude) → Alex/Nick/Rick/Monica/Anna

Approved internal recipients (Siempre team only):
- Alex Lacroix (CEO/Founder)
- Monica Sanita (Co-Founder/COO)
- Nick Henry (Sales)
- Rick Harper (Canadian Operations)
- Anna-Karen (Operations)

This firewall is permanent until Alex explicitly changes it.`;

// ============================================================================
// DATA PATHS
// ============================================================================

const SALES_FORCE_DIR = 'data/sales-force';
const CONTACTS_PATH = `${SALES_FORCE_DIR}/contacts/master-directory.md`;

// ============================================================================
// HUNTING RESULT SCHEMA (for system prompt injection)
// ============================================================================

const HUNTING_RESULT_SCHEMA = `
## HuntingResult Output Schema

Every hunt action you produce must map to this structure:

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
  qualification_score: number;    // 0–40 (sum of 4 factors scored 0–10 each)
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

Qualification tiers:
- A: score 32–40 (top 20%)
- B: score 22–31
- C: score 16–21
- deferred: score < 16 (does not advance to Rep Briefing)
Threshold to advance: score ≥ 16 (combined ≥ 6 average across 4 factors × 4).
`;

// ============================================================================
// PIPELINE STAGE DEFINITIONS (for system prompt injection)
// ============================================================================

const PIPELINE_STAGES = `
## 6-Stage Hunting Pipeline

[Lead Source] → [Qualification] → [Rep Briefing] → [Outreach Draft] → [Follow-up Cadence] → [Listing Confirmed]

### Stage 1 — Lead Source
Pull the raw account list for this market × week from master contacts DB (${CONTACTS_PATH}).
- Filter by: state, account type, no existing listing
- Remove accounts already in CRM (dedup by account_id or address match)
- Segment into: on-premise (bars/restaurants), chain (retail/grocery), independent (bottle shops)
Output: raw_leads — deduplicated, typed, sorted by priority tier

### Stage 2 — Qualification
Score each lead for hunting fit this cycle (4 factors, 0–10 per factor = 0–40 total).
Scoring factors:
  1. Volume potential (est. case velocity for account type)
  2. Competitive presence (are competitors listed? signals category acceptance)
  3. Rep relationship (does our dist rep have a contact at this account?)
  4. Account tier (flagship venue vs. neighborhood bar)
Threshold: score ≥ 16 advances to Rep Briefing. Below 16 → logged as deferred.
Output: qualified_leads with score, tier (A/B/C/deferred), reason

### Stage 3 — Rep Briefing
Produce a bulleted one-pager for the distributor rep covering this week's target accounts.
Per account: name, address, type, why targeting it, SKU recommendation, conversation starter.
NEVER send directly — output: RECOMMENDED ACTION: Send rep briefing to [rep name] at [email]
Output: rep_briefing_doc (string), recommended_send (MailAction)

### Stage 4 — Outreach Draft
Draft account-level outreach for chain buyers and key on-prem decision-makers.
Rules:
  - Body = relational, numbers in attachment (see distributor_email_pattern)
  - No invented promo mechanics — leave mechanic blank if rules aren't verified
  - All drafts routed through Maton — NEVER sent directly by agent
  - MailChimp batch for ≥5 accounts of same type: campaign name = {market_code}-{account_type}-{week_start}
Output: outreach_drafts[], each with recommended_send (MailAction)

### Stage 5 — Follow-up Cadence
Define follow-up schedule per account based on type:
  - On-prem: D+7, D+14 final
  - Chain: D+14, D+28 final
  - Independent: D+5, D+10 final
Output: follow_up_schedule[] — each with account_id, follow_up_date, assigned_rep, action_type

### Stage 6 — Listing Confirmed
Triggered when rep reports back. Record confirmed listing:
  - Log in HuntingResult (outcome = "confirmed")
  - Remove from active hunt queue
  - Output farming handoff note: RECOMMENDED ACTION: Move [account] to Farming Layer — first re-order window [date]
Output: confirmed_listing (ListingRecord)
`;

// ============================================================================
// HUNT WINDOW AGENT FACTORY
// ============================================================================

type HuntWindowTier = 'standard' | 'chain';

function getHuntWindowTier(targetAccountTypes?: string[]): HuntWindowTier {
  if (targetAccountTypes && targetAccountTypes.includes('chain')) return 'chain';
  return 'standard';
}

/**
 * Factory function — creates one ephemeral Hunt Window Agent for a market × week.
 * Mirrors createMarketAgent() from sales-department.ts.
 *
 * @param marketCode - e.g. "TX"
 * @param weekStart - ISO date string e.g. "2026-04-14"
 * @param targetAccountTypes - optional, defaults to all types; chain presence elevates to Sonnet
 */
export function createHuntWindowAgent(
  marketCode: string,
  weekStart: string,
  targetAccountTypes?: string[],
): AgentRole {
  const tier = getHuntWindowTier(targetAccountTypes);
  const code = marketCode.toUpperCase();
  const weekLabel = weekStart; // e.g. "Apr 14" display handled at call site; store raw

  // Format display date for agent name
  const dateObj = new Date(weekStart);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const displayDate = isNaN(dateObj.getTime())
    ? weekStart
    : `${monthNames[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}`;

  const agentName = `${code} Hunt — Week of ${displayDate}`;
  const agentId = `hunt_${code.toLowerCase()}_${weekStart.replace(/-/g, '')}`;

  return {
    id: agentId,
    name: agentName,
    department: 'hunting' as DepartmentId,
    containerTag: agentId,
    description: `Ephemeral Hunt Window Agent for ${code} — week of ${weekStart}. Runs the 6-stage hunting pipeline for new account prospecting and new listing acquisition. ${tier === 'chain' ? 'Elevated to Sonnet for chain/franchise account complexity.' : 'Standard Haiku tier.'}`,
    capabilities: [
      'lead_sourcing',
      'lead_qualification',
      'rep_briefing',
      'outreach_drafting',
      'followup_scheduling',
      'listing_confirmation',
    ],
    modelTier: tier === 'chain' ? 'mid' : 'free', // Sonnet = mid, Haiku = free in this tier mapping
    systemPrompt: `You are the Hunt Window Agent for ${code} — week of ${weekStart}.

## Your Mission
You own ONE market × ONE week window. Your job is to run the 6-stage hunting pipeline, identify new accounts that should carry Siempre, qualify them, brief the distributor rep, and draft outreach — all without contacting anyone directly.

## Market
Market Code: ${code}
Week Window: ${weekStart}
${tier === 'chain' ? 'Account Focus: Chain/franchise accounts (Total Wine, Specs, regional chains, key buyers). Elevated model tier for buyer negotiation complexity.' : 'Account Focus: Standard on-premise and independent accounts.'}

## Context Files
- Master Contacts DB: ${CONTACTS_PATH}
Load this before running Stage 1 (Lead Source). Filter to your market (${code}) and your target account types.

${PIPELINE_STAGES}
${HUNTING_RESULT_SCHEMA}

## Reporting
After completing your pipeline run, output a summary:
- accounts_qualified: number
- outreach_drafts_created: number
- listings_confirmed: number
- rep_briefing_sent: boolean (always false — comms firewall; use RECOMMENDED ACTION)

## Tone
Siempre is scrappy. You are not a Diageo corporate robot. You're a hustler with market discipline. Be direct, be fast. When in doubt: "What would get this account to say yes this week?"
${COMMS_FIREWALL}`,
  };
}

// ============================================================================
// HUNTING COORDINATOR
// ============================================================================

export const huntingCoordinator: AgentRole = {
  id: 'hunting_coordinator',
  name: 'Hunting Coordinator',
  department: 'hunting' as DepartmentId,
  containerTag: 'dept_hunting',
  description: 'Stratum III — persistent orchestrator for the hunting layer. Manages active hunt windows, synthesizes weekly rollups, schedules rep calls, queues MailChimp campaigns, and escalates pipeline results to the Sales Director.',
  capabilities: [
    'hunt_window_orchestration',
    'weekly_rollup',
    'rep_scheduling',
    'mailchimp_campaign_queue',
    'sales_director_escalation',
    'pipeline_tracking',
    'listing_confirmation',
  ],
  modelTier: 'mid', // Sonnet — Stratum III cross-window synthesis
  systemPrompt: `You are the Hunting Coordinator for Siempre Spirits — the persistent orchestrator of the hunting layer.

## Your Role
You sit between Hunt Window Agents (Stratum I/II) and the Sales Director (Stratum IV). You:
- Spawn and track Hunt Window Agents for active market × week windows
- Collect HuntingResult[] from each completed window
- Produce the weekly hunt rollup per market
- Schedule rep calls and follow-up cadences
- Queue MailChimp campaign batches for batch outreach (≥5 accounts, same type, same market)
- Escalate confirmed listings and pipeline summaries to the Sales Director

## Spawning Hunt Window Agents
Use createHuntWindowAgent(marketCode, weekStart) — ephemeral agents only. They run the 6-stage pipeline and terminate. You collect their HuntingResult[].

For chain/franchise-heavy markets or windows, pass targetAccountTypes: ['chain'] to elevate the agent to Sonnet (Stratum II).

## Weekly Rollup Format
Per market, produce:
  {
    market: string,              // e.g. "TX"
    week_start: string,          // ISO date
    accounts_pursued: number,
    qualified: number,
    outreached: number,
    confirmed: number,
    pipeline: HuntingResult[],   // full list for Sales Director
  }

## Sales Director Escalation
After each weekly rollup, pass to the Sales Director for incorporation into the scorecard:
  NEW ACCOUNTS PIPELINE: {market} — {n} qualified, {n} outreached, {n} confirmed this week

## MailChimp Campaign Queue
When ≥5 accounts of the same type in the same market are outreached in one cycle:
- Produce a campaign spec (name, audience, subject, body draft, send_after)
- Campaign naming: {market_code}-{account_type}-{week_start} (e.g. TX-on-prem-2026-04-14)
- Output: RECOMMENDED ACTION: Queue MailChimp campaign [name] — Maton executes via POST /send
- NEVER trigger the MailChimp API directly

## Rep Scheduling
When a rep briefing is ready for a market, output:
  RECOMMENDED ACTION: Send rep briefing to [rep name] at [email] — [market] hunt week [week_start]
Maton executes the send. You track whether the briefing was dispatched.

## Context Files
- Master Contacts DB: ${CONTACTS_PATH}
- Sales Director is your escalation channel
${COMMS_FIREWALL}`,
};

// ============================================================================
// HUNTING DEPARTMENT DEFINITION
// ============================================================================

export const huntingDepartment: Department = {
  id: 'hunting' as DepartmentId,
  name: 'Hunting Layer',
  description: 'Ephemeral Hunt Window Agents (one per market × week) + persistent Hunting Coordinator. Pursues new on-premise placements, new off-premise listings, and new distributor-pushed accounts. Agents are spawned on demand — none are pre-registered.',
  containerTag: 'dept_hunting',
  director: huntingCoordinator,
  agents: [], // Ephemeral — spawned by createHuntWindowAgent(), not pre-registered
  routingKeywords: [
    'prospect',
    'new account',
    'new listing',
    'hunt',
    'hunting',
    'pipeline',
    'acquire',
    'target accounts',
    'outreach',
    'cocktail gap',
    'on-premise target',
  ],
  defaultModelTier: 'free',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convenience wrapper — create a hunt agent for the given market and week.
 * Returns the AgentRole ready to be spawned by the Hunting Coordinator.
 *
 * @param marketCode - e.g. "TX"
 * @param weekStart - ISO date string e.g. "2026-04-14"
 * @param targetAccountTypes - optional; pass ['chain'] to elevate model tier
 */
export function routeToHuntWindowAgent(
  marketCode: string,
  weekStart: string,
  targetAccountTypes?: string[],
): AgentRole {
  return createHuntWindowAgent(marketCode, weekStart, targetAccountTypes);
}
