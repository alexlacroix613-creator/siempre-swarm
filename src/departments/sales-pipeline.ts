/**
 * Sales Department Pipeline — Market query → Analysis → Executive action.
 *
 * Unlike Sales Intel (which pulls DATA from portals), the Sales pipeline
 * is about MARKET MANAGEMENT: distributor health, KPI tracking, account
 * development, compliance monitoring, and executive recommendations.
 *
 * Pipeline:
 *   1. MARKET_IDENTIFY — Which market(s)? Route to the right agent(s).
 *   2. DOSSIER_LOAD — Agent loads foundation + market-specific dossier.
 *   3. AGENT_ANALYSIS — Market agent analyzes using dossier context.
 *   4. DIRECTOR_SYNTHESIS — Sales Director synthesizes cross-market view (if multi-market).
 *   5. SOLACE_REVIEW — I (Solace/Claude) verify, add context, apply comms firewall.
 *   6. EXECUTIVE_ACTION — Deliver to Alex with actionable recommendations.
 *
 * COMMS FIREWALL: Enforced at every stage. No output reaches anyone
 * outside @siempretequila.com. Period.
 */

import { routeToMarketAgent, getMarketDossierPath, getMarketCounts } from './sales-department.js';

// ============================================================================
// PIPELINE STAGES
// ============================================================================

export const SALES_PIPELINE_STAGES = [
  'market_identify',     // Parse query → which market(s)?
  'dossier_load',        // Load foundation.md + market dossier/shell
  'agent_analysis',      // Market agent produces analysis with dossier context
  'director_synthesis',  // Sales Director cross-references (multi-market only)
  'solace_review',       // Solace reviews, applies comms firewall, adds context
  'executive_action',    // Delivered to Alex with RECOMMENDED ACTIONs
] as const;

export type SalesPipelineStage = typeof SALES_PIPELINE_STAGES[number];

// ============================================================================
// TASK CLASSIFICATION
// ============================================================================

export type SalesTaskType =
  | 'market_check'       // "How's Georgia doing?" — single market quick check
  | 'market_deep_dive'   // "Give me the full picture on Texas" — comprehensive
  | 'scorecard'          // "Weekly scorecard for Tier 1" — KPI rollup
  | 'distributor_health' // "How's our relationship with United?" — distributor focus
  | 'escalation'         // "What needs my attention?" — RED market scan
  | 'national_rollup'    // "How are we doing nationally?" — all markets
  | 'onboarding'         // "We're entering Nebraska" — new market activation
  | 'compliance_check'   // "Any compliance risks?" — regulatory scan
  | 'farming_check';     // "Which accounts haven't re-ordered in 30 days?" — account health

export function classifySalesTask(prompt: string): SalesTaskType {
  const lower = prompt.toLowerCase();

  if (lower.includes('farm') || lower.includes('re-order') || lower.includes('reorder') ||
      lower.includes('account health') || lower.includes('going cold') || lower.includes('at risk') ||
      lower.includes('lapsed') || lower.includes('listing at risk') || lower.includes('volume drop') ||
      lower.includes('rep unresponsive') || lower.includes('no contact') || lower.includes('stale') ||
      lower.includes('recover'))
    return 'farming_check';
  if (lower.includes('scorecard') || lower.includes('kpi') || lower.includes('weekly'))
    return 'scorecard';
  if (lower.includes('distributor') || lower.includes('relationship') || lower.includes('united') ||
      lower.includes('winebow') || lower.includes('rndc') || lower.includes('breakthru') ||
      lower.includes('johnson brothers') || lower.includes('maverick'))
    return 'distributor_health';
  if (lower.includes('attention') || lower.includes('urgent') || lower.includes('red') ||
      lower.includes('escalat') || lower.includes('problem') || lower.includes('issue'))
    return 'escalation';
  if (lower.includes('national') || lower.includes('all markets') || lower.includes('overall') ||
      lower.includes('company') || lower.includes('how are we doing'))
    return 'national_rollup';
  if (lower.includes('enter') || lower.includes('launch') || lower.includes('onboard') ||
      lower.includes('activate') || lower.includes('new market'))
    return 'onboarding';
  if (lower.includes('compliance') || lower.includes('regulatory') || lower.includes('license') ||
      lower.includes('listing') || lower.includes('delist'))
    return 'compliance_check';
  if (lower.includes('deep dive') || lower.includes('full picture') || lower.includes('everything about') ||
      lower.includes('comprehensive') || lower.includes('dossier'))
    return 'market_deep_dive';

  return 'market_check';
}

// ============================================================================
// PIPELINE STAGE SELECTION
// ============================================================================

export function getSalesPipelineStages(taskType: SalesTaskType): SalesPipelineStage[] {
  switch (taskType) {
    case 'market_check':
      // Fast path: single market, agent analysis, Solace review
      return ['market_identify', 'dossier_load', 'agent_analysis', 'solace_review', 'executive_action'];

    case 'market_deep_dive':
      // Full pipeline including director synthesis
      return ['market_identify', 'dossier_load', 'agent_analysis', 'director_synthesis', 'solace_review', 'executive_action'];

    case 'scorecard':
      // Multi-market, needs director to roll up KPIs
      return ['market_identify', 'dossier_load', 'agent_analysis', 'director_synthesis', 'solace_review', 'executive_action'];

    case 'distributor_health':
      // Single market focus but deeper analysis
      return ['market_identify', 'dossier_load', 'agent_analysis', 'solace_review', 'executive_action'];

    case 'escalation':
      // Director scans all markets for RED flags
      return ['director_synthesis', 'solace_review', 'executive_action'];

    case 'national_rollup':
      // Full sweep — all agents report, director synthesizes
      return ['market_identify', 'dossier_load', 'agent_analysis', 'director_synthesis', 'solace_review', 'executive_action'];

    case 'onboarding':
      // Load shell, produce activation checklist
      return ['market_identify', 'dossier_load', 'agent_analysis', 'director_synthesis', 'solace_review', 'executive_action'];

    case 'compliance_check':
      // Market agent checks regulatory framework from dossier
      return ['market_identify', 'dossier_load', 'agent_analysis', 'solace_review', 'executive_action'];

    case 'farming_check':
      // Route to Farming Coordinator — no dossier load, farming has its own pipeline
      return ['market_identify', 'agent_analysis', 'solace_review', 'executive_action'];
  }
}

// ============================================================================
// MARKET ROUTING
// ============================================================================

/**
 * Identify which market agent(s) a query targets.
 * Returns agent IDs for all matched markets.
 */
export function identifyTargetMarkets(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const agents: string[] = [];

  // Check for explicit market references
  const singleAgent = routeToMarketAgent(prompt);
  if (singleAgent) {
    agents.push(singleAgent);
  }

  // Check for tier-level queries
  if (lower.includes('tier 1') || lower.includes('tier one') || lower.includes('priority markets')) {
    agents.push(
      'sales_ca', 'sales_tx', 'sales_co', 'sales_wa',
      'sales_or', 'sales_fl', 'sales_il', 'sales_on',
    );
  }
  if (lower.includes('tier 2') || lower.includes('tier two') || lower.includes('active markets')) {
    agents.push(
      'sales_ks', 'sales_ok', 'sales_tn', 'sales_ga',
      'sales_ar', 'sales_mo', 'sales_va', 'sales_ut',
      'sales_ab', 'sales_sk', 'sales_mb', 'sales_bc',
    );
  }
  if (lower.includes('canada') || lower.includes('canadian')) {
    agents.push('sales_on', 'sales_ab', 'sales_sk', 'sales_mb', 'sales_bc');
  }

  // Deduplicate
  return [...new Set(agents)];
}

/**
 * Build the context loading instructions for a market agent.
 * Returns the file paths the agent needs to load.
 */
export function getAgentContextFiles(agentId: string): { foundation: string; dossier: string } {
  const code = agentId.replace('sales_', '').toUpperCase();
  return {
    foundation: 'data/sales-force/foundation.md',
    dossier: getMarketDossierPath(code),
  };
}

// ============================================================================
// COMMS FIREWALL ENFORCEMENT
// ============================================================================

/**
 * Validate that an agent's output does not contain external contact attempts.
 * Returns violations found.
 */
export function enforceCommsFirewall(agentOutput: string): string[] {
  const violations: string[] = [];
  const lower = agentOutput.toLowerCase();

  // Check for email drafting language
  if (lower.includes('dear ') && (lower.includes('distributor') || lower.includes('retailer')))
    violations.push('FIREWALL: Agent appears to be drafting external correspondence');

  // Check for contact instructions
  if (lower.includes('send email to') || lower.includes('email them') || lower.includes('reach out to'))
    if (!lower.includes('recommended action:'))
      violations.push('FIREWALL: Agent is instructing external contact without RECOMMENDED ACTION format');

  // Check for non-siempre email addresses
  const emailRegex = /[\w.-]+@(?!siempretequila\.com)\w+\.\w+/gi;
  const externalEmails = agentOutput.match(emailRegex);
  if (externalEmails && externalEmails.length > 0) {
    // Allow listing distributor contacts from dossiers (informational)
    // But flag if in imperative context
    const imperative = lower.includes('contact ') || lower.includes('email ') || lower.includes('call ');
    if (imperative) {
      violations.push(`FIREWALL: External emails found in imperative context: ${externalEmails.join(', ')}`);
    }
  }

  return violations;
}

/**
 * Pipeline summary for logging/monitoring.
 */
export function getPipelineSummary() {
  const counts = getMarketCounts();
  return {
    department: 'sales',
    pipeline: 'sales-pipeline',
    stages: SALES_PIPELINE_STAGES.length,
    taskTypes: 9,
    markets: counts,
    commsFirewall: 'ACTIVE — zero external contact authority',
    approvedRecipients: ['alex@siempretequila.com', 'monica@siempretequila.com', 'nick@siempretequila.com', 'rick@siempretequila.com'],
  };
}
