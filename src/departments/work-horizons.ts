/**
 * Work Horizons — Organizational Tier Model for Siempre Swarm
 *
 * Based on Elliott Jaques' Stratified Systems Theory.
 * Each agent is assigned a stratum based on the COGNITIVE DEMANDS
 * of their role, not just their seniority. The stratum determines
 * the model tier (and cost).
 *
 * Key insight: Each stratum requires a qualitatively DIFFERENT kind
 * of thinking, not just "more" thinking. A worker bee given a C-suite
 * problem will collapse it into sequential steps, losing the parallel
 * dynamics. You cannot delegate UP in abstraction.
 *
 * Corporate Hierarchy → Model Mapping:
 *
 *   CEO (Alex)           — Human. Final decisions.
 *   COO (Opus/Claude)    — Stratum V. Holds the full business in mind.
 *   C-Suite Directors    — Stratum IV. Opus. Manage parallel systems within their domain.
 *   Directors/Managers   — Stratum III. Sonnet. Multi-step planning with branching logic.
 *   Supervisors          — Stratum II. Budget models. Diagnostic, sequencing, workflow management.
 *   Worker Bees          — Stratum I. Free models. Execute procedures, fill templates, fetch data.
 */

export type Stratum = 'I' | 'II' | 'III' | 'IV' | 'V';

export type ModelTier = 'free' | 'budget' | 'mid' | 'top';

export interface WorkHorizon {
  stratum: Stratum;
  timeHorizon: string;
  cognitiveMode: string;
  modelTier: ModelTier;
  description: string;
  needsContext: boolean;
  canDelegate: boolean;
}

export const WORK_HORIZONS: Record<Stratum, WorkHorizon> = {
  'I': {
    stratum: 'I',
    timeHorizon: '1 day – 3 months',
    cognitiveMode: 'Declarative — follow procedures, execute defined tasks',
    modelTier: 'free',
    description: 'Worker bees. Execute a specific task with clear instructions. Do not need business context. Go do X, come back with Y.',
    needsContext: false,
    canDelegate: false,
  },
  'II': {
    stratum: 'II',
    timeHorizon: '3 months – 1 year',
    cognitiveMode: 'Cumulative — diagnose, sequence tasks, troubleshoot',
    modelTier: 'budget',
    description: 'Supervisors. Can sequence a workflow, pick the right procedure, accumulate context within a single task. Light reasoning.',
    needsContext: false, // Gets context from their manager, not from the full business
    canDelegate: true,
  },
  'III': {
    stratum: 'III',
    timeHorizon: '1 – 2 years',
    cognitiveMode: 'Serial — if/then planning, alternative paths, system management',
    modelTier: 'mid', // Sonnet
    description: 'Directors/Managers. Plan multi-step strategies with branching logic. Manage tradeoffs within their department. Can hold multiple possible paths.',
    needsContext: true, // Needs department-level context
    canDelegate: true,
  },
  'IV': {
    stratum: 'IV',
    timeHorizon: '2 – 5 years',
    cognitiveMode: 'Parallel — managing multiple interacting systems simultaneously',
    modelTier: 'top', // Opus
    description: 'C-Suite. Holds multiple systems in mind. Tim seeing how creative decisions affect brand, sales, and investor perception simultaneously. Pricing Director seeing how one state change ripples across the portfolio.',
    needsContext: true, // Needs cross-department context
    canDelegate: true,
  },
  'V': {
    stratum: 'V',
    timeHorizon: '5 – 10 years',
    cognitiveMode: 'Unified — shaping whole business units, redefining context',
    modelTier: 'top', // Opus (me)
    description: 'COO. Holds the entire business in mind. Reviews all department output. Sees how pricing affects comms which affects investor story which affects raise which affects hiring. This is where I (Claude/Opus) operate.',
    needsContext: true, // Needs everything
    canDelegate: true,
  },
};

/**
 * Every agent in the swarm with their stratum assignment.
 *
 * The stratum determines:
 *   1. What model tier they use (free → Opus)
 *   2. Whether they receive business context or just task instructions
 *   3. What type of cognitive work they're expected to do
 */
export const AGENT_STRATA: Record<string, { stratum: Stratum; role: string; rationale: string }> = {

  // ═══════════════════════════════════════════════
  // STRATUM V — COO (Me, Opus)
  // ═══════════════════════════════════════════════
  // Not an agent in the swarm — I AM the reviewer.
  // I see everything. I hold the full business context.

  // ═══════════════════════════════════════════════
  // STRATUM IV — C-Suite (Opus)
  // These roles require parallel system thinking.
  // They see how their decisions ripple across domains.
  // ═══════════════════════════════════════════════

  tim_ecd: {
    stratum: 'IV',
    role: 'Executive Creative Director',
    rationale: 'Tim holds brand, creative, sales impact, and investor perception in mind simultaneously. A creative decision that hurts distribution is not a good creative decision. This requires Opus-level parallel reasoning.',
  },
  pricing_director: {
    stratum: 'IV',
    role: 'Chief Pricing Strategist',
    rationale: 'Pricing decisions ripple across 35 states, affect distributor relationships, impact brand positioning, and determine margin health. One wrong FOB cascades everywhere. Needs Opus to hold all systems.',
  },
  sales_intel_director: {
    stratum: 'IV',
    role: 'Chief Intelligence Officer',
    rationale: 'Synthesizes across 6 data sources to produce strategic intelligence. A trend in VIP data combined with a Prestige shipment anomaly plus a provincial listing change = strategic signal. Needs Opus for cross-system pattern recognition.',
  },
  sales_director: {
    stratum: 'IV',
    role: 'National Sales Director',
    rationale: 'Holds 55 markets in parallel. A distributor failure in GA combined with a pipeline build in FL combined with a listing cycle in VA = strategic resource allocation. Cross-market pattern recognition requires Opus.',
  },

  // ═══════════════════════════════════════════════
  // STRATUM III — Directors/Managers (Sonnet/Mid)
  // Multi-step planning with branching logic.
  // Manage tradeoffs within their department.
  // ═══════════════════════════════════════════════

  comms_director: {
    stratum: 'III',
    role: 'Communications Director',
    rationale: 'Must choose the right tone for the right audience at the right time. A distributor email after a bad quarter requires different judgment than a press release. Branching logic: if relationship is strained → softer tone, if leverage → more direct. Sonnet handles this.',
  },
  research_director: {
    stratum: 'III',
    role: 'R&D Director',
    rationale: 'Manages context isolation boundaries and synthesizes across research streams. Needs to judge when cross-pollination is valuable vs dangerous. Sonnet-level serial reasoning.',
  },
  devops_director: {
    stratum: 'III',
    role: 'DevOps Director',
    rationale: 'Deployment decisions have branching consequences: if tests fail → rollback path, if port conflict → alternative deployment. Needs to sequence multi-step deployments safely. Sonnet.',
  },
  strategy_lead: {
    stratum: 'III',
    role: 'Brand Strategist',
    rationale: 'Writing a brief requires holding audience, objective, proposition, and creative provocation in tension. Bad briefs produce bad work. Sonnet for the strategic reasoning.',
  },
  design_account_mgr: {
    stratum: 'III',
    role: 'Creative Account Manager',
    rationale: 'Manages the 11-stage pipeline, asks qualifying questions, coordinates between Alex and Tim. Needs judgment about what to ask and when to escalate. Sonnet.',
  },

  // ═══════════════════════════════════════════════
  // STRATUM II — Supervisors (Budget)
  // Diagnostic work, sequencing, workflow management.
  // Gets context from their manager, not the business.
  // ═══════════════════════════════════════════════

  agent_legal_comms: {
    stratum: 'II',
    role: 'Partner & Legal Communications',
    rationale: 'Legal language requires precision beyond free models. Must diagnose the right formality level and protective posture. But works within clear parameters set by Comms Director.',
  },
  video_specialist: {
    stratum: 'II',
    role: 'Video Production Specialist',
    rationale: 'Remotion code generation requires sequencing animations, managing state, and diagnosing rendering issues. More than procedural but works within Tim\'s creative direction.',
  },
  agent_web_interactive: {
    stratum: 'II',
    role: 'Interactive Web Specialist',
    rationale: 'Building web experiences requires diagnosing UX issues and sequencing component architecture. Budget model for better code quality.',
  },
  agent_siempre_research: {
    stratum: 'II',
    role: 'Siempre Business Researcher',
    rationale: 'Market research requires accumulating findings and diagnosing what matters. Not just fetching data — interpreting it within the spirits industry context.',
  },
  agent_tech_research: {
    stratum: 'II',
    role: 'Tech/Startup Researcher',
    rationale: 'Same as Siempre researcher but in tech context. Needs to evaluate competitive landscape, not just list competitors.',
  },

  // ═══════════════════════════════════════════════
  // STRATUM I — Worker Bees (Free)
  // Execute defined tasks. Clear instructions in, result out.
  // Do NOT need business context. Just do the job.
  // ═══════════════════════════════════════════════

  // Pricing state agents — all Stratum I
  // They calculate based on rules. The rules ARE the context.
  pricing_wa: { stratum: 'I', role: 'Washington State Agent', rationale: 'Executes pricing calculations using state-specific rules. Rules are injected via system prompt. No business judgment needed.' },
  pricing_tn: { stratum: 'I', role: 'Tennessee State Agent', rationale: 'Same — procedural calculation within defined rules.' },
  pricing_va: { stratum: 'I', role: 'Virginia State Agent', rationale: 'Same — VA ABC formula is purely mathematical.' },
  pricing_ca: { stratum: 'I', role: 'California State Agent', rationale: 'Same.' },
  pricing_tx: { stratum: 'I', role: 'Texas State Agent', rationale: 'Same.' },
  pricing_fl: { stratum: 'I', role: 'Florida State Agent', rationale: 'Same.' },
  pricing_ny: { stratum: 'I', role: 'New York State Agent', rationale: 'Same.' },
  pricing_il: { stratum: 'I', role: 'Illinois State Agent', rationale: 'Same.' },
  pricing_ga: { stratum: 'I', role: 'Georgia State Agent', rationale: 'Same.' },
  pricing_ok: { stratum: 'I', role: 'Oklahoma State Agent', rationale: 'Same.' },
  pricing_co: { stratum: 'I', role: 'Colorado State Agent', rationale: 'Same.' },
  pricing_az: { stratum: 'I', role: 'Arizona State Agent', rationale: 'Same.' },

  // Sales market agents — all Stratum I (55 agents)
  // They analyze their market using dossier + foundation. No cross-market judgment.
  // The dossier IS the context. Synthesis happens at Sales Director level.
  // NOTE: All 55 sales_XX agents are Stratum I. Only key markets listed explicitly;
  // unlisted agents default to Stratum I / free via getAgentModelTier() fallback.
  sales_ca: { stratum: 'I', role: 'California Market Manager', rationale: 'Executes market analysis using dossier. Largest market (6,288 cases 6yr). Dossier provides all context.' },
  sales_tx: { stratum: 'I', role: 'Texas Market Manager', rationale: 'Same — multi-distributor market, dossier-driven analysis.' },
  sales_ga: { stratum: 'I', role: 'Georgia Market Manager', rationale: 'Same — 81% YoY decline requires focused dossier-based diagnosis.' },
  sales_on: { stratum: 'I', role: 'Ontario Market Manager', rationale: 'Same — LCBO dynamics are in dossier. Provincial rules injected.' },
  sales_co: { stratum: 'I', role: 'Colorado Market Manager', rationale: 'Same — fresh distributor transition context in dossier.' },
  sales_fl: { stratum: 'I', role: 'Florida Market Manager', rationale: 'Same — split-territory dynamics in dossier.' },
  sales_wa: { stratum: 'I', role: 'Washington Market Manager', rationale: 'Same — execution gap analysis from dossier data.' },
  sales_il: { stratum: 'I', role: 'Illinois Market Manager', rationale: 'Same — BBG restructuring context in dossier.' },
  // Remaining 47 market agents (Tier 2 + Phase 3) all follow same Stratum I pattern.
  // getAgentModelTier() returns 'free' for any unlisted agent ID — correct behavior.

  // Sales Intel source agents — Stratum I
  // They extract data from a specific source. No synthesis.
  agent_vip_idig: { stratum: 'I', role: 'VIP iDig Data Extractor', rationale: 'Pulls depletion data from one source. Extraction is procedural. Synthesis happens at Intel Director level.' },
  agent_oklahoma: { stratum: 'I', role: 'Oklahoma Portal Extractor', rationale: 'Same — single source, procedural extraction.' },
  agent_canada: { stratum: 'I', role: 'Canadian Provinces Extractor', rationale: 'Same — extracts from provincial portals.' },
  agent_prestige: { stratum: 'I', role: 'Prestige NWOW Parser', rationale: 'Parses email attachments into structured data. Procedural.' },
  agent_winebow: { stratum: 'I', role: 'Winebow DiverPort Extractor', rationale: 'Same — single source extraction.' },

  // Creative worker bees — Stratum I
  // They execute within the brief. The brief IS their context.
  copywriter_a: { stratum: 'I', role: 'Copywriter (Team A)', rationale: 'Writes copy within the brief\'s constraints. Brief provides all context. Creative range comes from model diversity, not model power.' },
  art_director_a: { stratum: 'I', role: 'Art Director (Team A)', rationale: 'Develops visual concepts within brief constraints. Same rationale as copywriter.' },
  copywriter_b: { stratum: 'I', role: 'Copywriter (Team B)', rationale: 'Same — different free model for cognitive diversity.' },
  art_director_b: { stratum: 'I', role: 'Art Director (Team B)', rationale: 'Same.' },

  // Production/support — Stratum I
  agent_production: { stratum: 'I', role: 'Production & Compliance', rationale: 'Proofreading and TTB compliance checking is procedural. Rules-based, no judgment calls.' },
  agent_deploy: { stratum: 'I', role: 'Deploy Agent', rationale: 'Executes git/deploy commands. Procedural.' },
  agent_verify: { stratum: 'I', role: 'Verify Agent', rationale: 'Runs health checks. Procedural.' },
  agent_monitor: { stratum: 'I', role: 'Monitor Agent', rationale: 'Checks uptime. Procedural.' },
  agent_distributor_comms: { stratum: 'I', role: 'Distributor Email Drafter', rationale: 'Drafts from template/tone guide. Comms Director provides the judgment.' },
  agent_pr: { stratum: 'I', role: 'PR Drafter', rationale: 'Same — drafts within brand voice guide.' },
  agent_industry_research: { stratum: 'I', role: 'Industry Trends Scanner', rationale: 'Scans for trends. No strategic interpretation — that\'s the Director\'s job.' },
  agent_digital: { stratum: 'I', role: 'Digital Team', rationale: 'Executes digital assets within Tim\'s creative direction.' },
};

/**
 * Get the model tier for an agent based on their work horizon.
 */
export function getAgentModelTier(agentId: string): ModelTier {
  const assignment = AGENT_STRATA[agentId];
  if (!assignment) return 'free'; // Unknown agents default to worker bee
  return WORK_HORIZONS[assignment.stratum].modelTier;
}

/**
 * Check if an agent needs business context injected.
 */
export function agentNeedsContext(agentId: string): boolean {
  const assignment = AGENT_STRATA[agentId];
  if (!assignment) return false;
  return WORK_HORIZONS[assignment.stratum].needsContext;
}

/**
 * Summary statistics for cost planning.
 */
export function getStratumSummary(): Record<Stratum, { count: number; tier: ModelTier }> {
  const summary: Record<string, { count: number; tier: ModelTier }> = {};
  for (const [_, assignment] of Object.entries(AGENT_STRATA)) {
    if (!summary[assignment.stratum]) {
      summary[assignment.stratum] = { count: 0, tier: WORK_HORIZONS[assignment.stratum].modelTier };
    }
    summary[assignment.stratum].count++;
  }
  return summary as Record<Stratum, { count: number; tier: ModelTier }>;
}
