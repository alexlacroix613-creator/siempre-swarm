/**
 * Sales Department — National AI Sales Force
 *
 * 55 market agents (one per state/province) + Sales Director.
 * Each agent loads the foundation document + its market-specific dossier.
 * Strict comms firewall: NO agent can contact anyone outside @siempretequila.com.
 *
 * Architecture:
 *   Sales Director (Stratum IV / Opus) — cross-market synthesis, scorecard rollup, escalation
 *   Market Agents (Stratum I / Free) — per-market analysis, KPI tracking, recommendations
 *
 * Data lives at: data/sales-force/
 *   foundation.md              — shared knowledge base for all agents
 *   dossiers/{state}-dossier.md — full market dossiers (Tier 1+2)
 *   dossiers/shells/{state}-shell.md — regulatory shells (Phase 3)
 *   contacts/master-directory.md — 102 contacts across all markets
 */

import type { Department, AgentRole, DepartmentId } from './types.js';
import { resolve } from 'path';

// ============================================================================
// COMMS FIREWALL — Baked into every agent at every level
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
const FOUNDATION_PATH = `${SALES_FORCE_DIR}/foundation.md`;
const DOSSIER_DIR = `${SALES_FORCE_DIR}/dossiers`;
const SHELL_DIR = `${SALES_FORCE_DIR}/dossiers/shells`;
const CONTACTS_PATH = `${SALES_FORCE_DIR}/contacts/master-directory.md`;

// ============================================================================
// MARKET DEFINITIONS
// ============================================================================

/** Tier 1: Highest activity markets with full dossiers */
const TIER_1_MARKETS: Array<[string, string]> = [
  ['California', 'CA'],
  ['Texas', 'TX'],
  ['Colorado', 'CO'],
  ['Washington', 'WA'],
  ['Oregon', 'OR'],
  ['Florida', 'FL'],
  ['Illinois', 'IL'],
  ['Ontario', 'ON'],
];

/** Tier 2: Active/transitioning markets with full dossiers */
const TIER_2_MARKETS: Array<[string, string]> = [
  ['Kansas', 'KS'],
  ['Oklahoma', 'OK'],
  ['Tennessee', 'TN'],
  ['Georgia', 'GA'],
  ['Arkansas', 'AR'],
  ['Missouri', 'MO'],
  ['Virginia', 'VA'],
  ['Utah', 'UT'],
  ['Alberta', 'AB'],
  ['Saskatchewan', 'SK'],
  ['Manitoba', 'MB'],
  ['British Columbia', 'BC'],
];

/** Phase 3: No active distribution — regulatory shells only */
const PHASE_3_MARKETS: Array<[string, string]> = [
  // Control States
  ['Alabama', 'AL'], ['Idaho', 'ID'], ['Iowa', 'IA'], ['Maine', 'ME'],
  ['Michigan', 'MI'], ['Mississippi', 'MS'], ['Montana', 'MT'],
  ['New Hampshire', 'NH'], ['North Carolina', 'NC'], ['Ohio', 'OH'],
  ['Pennsylvania', 'PA'], ['Vermont', 'VT'], ['West Virginia', 'WV'],
  ['Wyoming', 'WY'],
  // Franchise-Flagged
  ['Connecticut', 'CT'], ['Massachusetts', 'MA'], ['New Jersey', 'NJ'],
  ['Wisconsin', 'WI'],
  // Jurisdiction-Sensitive
  ['Alaska', 'AK'], ['Maryland', 'MD'], ['Minnesota', 'MN'],
  ['South Dakota', 'SD'],
  // Standard License
  ['Arizona', 'AZ'], ['Delaware', 'DE'], ['Hawaii', 'HI'],
  ['Indiana', 'IN'], ['Kentucky', 'KY'], ['Louisiana', 'LA'],
  ['Nebraska', 'NE'], ['Nevada', 'NV'], ['New Mexico', 'NM'],
  ['New York', 'NY'], ['North Dakota', 'ND'], ['Rhode Island', 'RI'],
  ['South Carolina', 'SC'],
];

/** All markets combined */
const ALL_MARKETS = [...TIER_1_MARKETS, ...TIER_2_MARKETS, ...PHASE_3_MARKETS];

// ============================================================================
// MARKET AGENT FACTORY
// ============================================================================

type MarketTier = 'tier1' | 'tier2' | 'phase3';

function getMarketTier(code: string): MarketTier {
  if (TIER_1_MARKETS.some(([, c]) => c === code)) return 'tier1';
  if (TIER_2_MARKETS.some(([, c]) => c === code)) return 'tier2';
  return 'phase3';
}

function getDossierPath(code: string, name: string, tier: MarketTier): string {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  if (tier === 'phase3') {
    return `${SHELL_DIR}/${slug}-${code.toLowerCase()}-shell.md`;
  }
  return `${DOSSIER_DIR}/${slug}-${code.toLowerCase()}-dossier.md`;
}

function createMarketAgent(name: string, code: string): AgentRole {
  const tier = getMarketTier(code);
  const dossierPath = getDossierPath(code, name, tier);
  const tierLabel = tier === 'tier1' ? 'Tier 1 (Priority)'
    : tier === 'tier2' ? 'Tier 2 (Active)'
    : 'Phase 3 (Shell)';

  return {
    id: `sales_${code.toLowerCase()}`,
    name: `${name} Market Manager`,
    department: 'sales' as DepartmentId,
    containerTag: `agent_sales_${code.toLowerCase()}`,
    description: `${tierLabel} market manager for ${name} (${code}). Owns distributor strategy, account priorities, pricing discipline, compliance, and KPI tracking for this market.`,
    capabilities: [
      'market_analysis',
      'distributor_management',
      'kpi_tracking',
      'compliance_monitoring',
      'account_development',
      'pricing_audit',
    ],
    modelTier: 'free',
    systemPrompt: `You are the dedicated market manager for ${name} (${code}) — a ${tierLabel} market in the Siempre Spirits national AI sales force.

## Your Identity
You own ONE market: ${name}. You do not have knowledge of or access to any other state's distributor relationships, pricing, accounts, or strategy. This isolation is intentional — it mirrors how Diageo, Pernod Ricard, and Brown-Forman structure their sales forces.

## Required Context
Before operating, you MUST have loaded:
1. Foundation document: ${FOUNDATION_PATH}
2. Your market dossier: ${dossierPath}

If you don't have both, stop and request them.

## Your Job
- Analyze your market's performance against targets (11 KPIs, 100-point scorecard)
- Track distributor health: reorder rates, pipeline coverage, ship-depl gaps
- Identify RED/YELLOW/GREEN status using the tiered scoring rules
- Produce actionable recommendations — name the distributor, lead with the number, diagnose don't describe
- Flag escalation triggers: compliance issues, performance drops >20%, distributor changes

## Reporting Source
${code === 'OK' ? '**EXCEPTION:** Use Dive → Optimus for depletion data. VIP iDig does NOT reliably capture Oklahoma.' :
  code === 'CA' ? '**NOTE:** VIP iDig integration is live for California. Real-time visibility available.' :
  ['ON', 'AB', 'SK', 'MB', 'BC'].includes(code) ? '**NOTE:** Use provincial liquor board portals. Canadian data has 60-90 day lag.' :
  'Standard: VIP iDig for US depletion data.'}

## Tone
Siempre is scrappy. You are not a Diageo corporate robot. You're a hustler who happens to have Diageo-level market discipline. Be direct, be fast, and don't over-corporatize. When in doubt, ask "what would move cases this week?" and do that.
${COMMS_FIREWALL}`,
  };
}

// ============================================================================
// SALES DIRECTOR
// ============================================================================

const salesDirector: AgentRole = {
  id: 'sales_director',
  name: 'Sales Director',
  department: 'sales' as DepartmentId,
  containerTag: 'dept_sales',
  description: 'National Sales Director. Synthesizes intelligence across all 55 markets, runs weekly scorecard rollups, handles cross-market escalations, and produces the executive sales briefing.',
  capabilities: [
    'cross_market_synthesis',
    'scorecard_rollup',
    'escalation_management',
    'distributor_strategy',
    'market_prioritization',
    'executive_briefing',
  ],
  modelTier: 'top', // Stratum IV — holds 55 markets in parallel
  systemPrompt: `You are the National Sales Director for Siempre Spirits, overseeing 55 markets (28 US states + 5 Canadian provinces + 22 regulatory shells).

## Your Role
You are the strategic layer between market-level execution and executive decision-making. You:
- Synthesize cross-market intelligence into actionable executive briefings
- Run weekly scorecard rollups across all active markets
- Prioritize which markets need attention (RED → YELLOW → GREEN)
- Handle escalations from market agents
- Coordinate with Sales Intelligence (data feeds) and Pricing (proposals)
- Produce the monthly Market Health Briefing

## Market Tiers
- **Tier 1 (8 markets):** CA, TX, CO, WA, OR, FL, IL, ON — highest activity, deepest dossiers
- **Tier 2 (12 markets):** KS, OK, TN, GA, AR, MO, VA, UT, AB, SK, MB, BC — active/transitioning
- **Phase 3 (35 markets):** Regulatory shells only — no active distribution

## Scoring Rules
- A Markets (6): 5-factor scoring (% to target, reorder rate, pipeline coverage, core SKU mix, spend/case)
- B Markets (12): 3-factor scoring (% to target, reorder rate, pipeline coverage)
- C Markets (35): 1-factor + dark market alert

## Diagnosis Principles
1. Name the distributor, not the state
2. Lead with the number
3. Diagnose, don't describe
4. Use three-tier language (shipments, depletions, pipeline)
5. End with a recommendation

## Tone
Write like a smart VP of Sales emailing the CEO at 7am. Direct, specific, actionable. No hedging. No "data suggests." Say what it IS.

## Context Files
- Foundation: ${FOUNDATION_PATH}
- Contact Directory: ${CONTACTS_PATH}
- Market Dossiers: ${DOSSIER_DIR}/
- Regulatory Shells: ${SHELL_DIR}/

## Integration Points
- Sales Intelligence department provides depletion/shipment/inventory data
- Pricing department provides state-specific pricing proposals
- Your output feeds the executive briefing and Alex's decision queue
${COMMS_FIREWALL}`,
};

// ============================================================================
// DEPARTMENT DEFINITION
// ============================================================================

// Build all market agent routing keywords
const marketKeywords: string[] = [];
for (const [name, code] of ALL_MARKETS) {
  marketKeywords.push(name.toLowerCase());
  marketKeywords.push(code.toLowerCase());
}

// Add distributor names and general sales keywords
const distributorKeywords = [
  'winebow', 'rndc', 'johnson brothers', 'maverick', 'breakthru',
  'united distributors', 'udiga', 'vintegrity', 'artisan',
  'central distributors', 'bevco', 'dandurand', 'lcbo', 'aglc',
  'bcldb', 'prestige', 'pbg',
];

const generalSalesKeywords = [
  'market manager', 'state manager', 'market health', 'scorecard',
  'dossier', 'distributor', 'accounts', 'pod', 'pods',
  'ride-with', 'display', 'menu', 'backbar', 'placement',
  'chain', 'on-premise', 'off-premise', 'reorder rate',
  'pipeline coverage', 'core sku', 'brand pyramid',
  'depleting', 'account calls', 'territory',
];

export const salesDepartment: Department = {
  id: 'sales' as DepartmentId,
  name: 'National Sales Force',
  description: 'AI-powered national sales organization. 55 market agents (one per state/province) with strict isolation between markets. Each agent loads foundation + market-specific dossier. Comms firewall: zero external contact authority.',
  containerTag: 'dept_sales',
  director: salesDirector,
  agents: ALL_MARKETS.map(([name, code]) => createMarketAgent(name, code)),
  routingKeywords: [
    ...generalSalesKeywords,
    ...distributorKeywords,
    ...marketKeywords,
  ],
  defaultModelTier: 'free',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Route a market-specific query to the correct agent.
 * Returns the agent ID for the matched market, or null.
 */
export function routeToMarketAgent(prompt: string): string | null {
  const lower = prompt.toLowerCase();

  for (const [name, code] of ALL_MARKETS) {
    // Match state code (exact word boundary) or full state name
    const codeRegex = new RegExp(`\\b${code.toLowerCase()}\\b`);
    if (codeRegex.test(lower) || lower.includes(name.toLowerCase())) {
      return `sales_${code.toLowerCase()}`;
    }
  }

  return null;
}

/**
 * Get the dossier file path for a market agent.
 */
export function getMarketDossierPath(code: string): string {
  const market = ALL_MARKETS.find(([, c]) => c === code);
  if (!market) return '';
  const [name] = market;
  const tier = getMarketTier(code);
  return getDossierPath(code, name, tier);
}

/**
 * Get market counts by tier.
 */
export function getMarketCounts() {
  return {
    tier1: TIER_1_MARKETS.length,
    tier2: TIER_2_MARKETS.length,
    phase3: PHASE_3_MARKETS.length,
    total: ALL_MARKETS.length,
  };
}

/**
 * List all markets with their tier and dossier status.
 */
export function listMarkets(): Array<{ name: string; code: string; tier: MarketTier; dossierPath: string }> {
  return ALL_MARKETS.map(([name, code]) => {
    const tier = getMarketTier(code);
    return {
      name,
      code,
      tier,
      dossierPath: getDossierPath(code, name, tier),
    };
  });
}
