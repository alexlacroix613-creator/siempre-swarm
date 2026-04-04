/**
 * Pricing Department Pipeline — Real workflow with Opus review gate.
 *
 * The pricing-intelligence skill already has a full engine (pricing_engine.py)
 * with 9 SKUs, 35 states, validation rules, and margin philosophy.
 * This pipeline orchestrates HOW that engine gets used by the swarm.
 *
 * Key principle: State agents do the legwork on free models.
 * Pricing Director (mid tier) reviews for consistency.
 * Opus (me) inspects everything before Alex sees it.
 *
 * Non-negotiable rules from the pricing skill:
 *   - 30% margin floor — HARD STOP, no exceptions
 *   - No desperation discounting
 *   - 90-day payback on all pricing/promo investments
 *   - Floor pricing — establish and defend in every market
 *   - FOB changes require 60-day lead time + team approval
 *   - Trade ROI: every $1 must return >= $1.50 gross profit in 120 days
 *
 * Pipeline stages:
 *   1. INTAKE — What state? What SKUs? New market or adjustment?
 *   2. DATA_PULL — State agent pulls compliance rules + tax structure
 *   3. CALCULATE — Run pricing_engine.py for price trees
 *   4. VALIDATE — Run validation checks (margin floor, SRP range, rules)
 *   5. SALES_CONTEXT — Cross-reference with sales intel data if available
 *   6. DIRECTOR_REVIEW — Pricing Director checks strategy alignment
 *   7. OPUS_REVIEW — I inspect accuracy, context, and judgment
 *   8. PRESENT — Deliver to Alex with confidence assessment
 */

export const PRICING_PIPELINE_STAGES = [
  'intake',          // What are we pricing? Which state? Which SKUs?
  'data_pull',       // State agent retrieves compliance, tax, distribution landscape
  'calculate',       // pricing_engine.py generates price trees
  'validate',        // Validation checks: margin floor, SRP target, rules
  'sales_context',   // Cross-reference with depletion/inventory data if available
  'director_review', // Pricing Director checks strategic alignment across states
  'opus_review',     // Opus inspects accuracy, catches conflicts with recent context
  'present',         // Deliver to Alex with confidence rating
] as const;

export type PricingPipelineStage = typeof PRICING_PIPELINE_STAGES[number];

/**
 * Task types the pricing department handles.
 * Each has a different pipeline depth.
 */
export type PricingTaskType =
  | 'quick_lookup'       // Single SKU/state calculation — fast path (stages 2-3-7-8)
  | 'proposal'           // Full distributor proposal — full pipeline
  | 'new_state_setup'    // New market entry — full pipeline + extra research
  | 'price_adjustment'   // Changing existing pricing — full pipeline + 60-day lead check
  | 'comparison'         // Multi-state comparison — parallel state agents + synthesis
  | 'validation'         // Check existing pricing against rules — stages 3-4-7-8
  | 'competitive_analysis'; // Benchmark against competitors — research + pricing

/**
 * Classify a pricing request to determine pipeline depth.
 */
export function classifyPricingTask(prompt: string): PricingTaskType {
  const lower = prompt.toLowerCase();

  if (lower.includes('new state') || lower.includes('new market') || lower.includes('enter') || lower.includes('launch in'))
    return 'new_state_setup';

  if (lower.includes('adjust') || lower.includes('change') || lower.includes('increase') || lower.includes('decrease') || lower.includes('raise') || lower.includes('lower'))
    return 'price_adjustment';

  if (lower.includes('compare') || lower.includes('across states') || lower.includes('side by side') || lower.includes('vs'))
    return 'comparison';

  if (lower.includes('validate') || lower.includes('check') || lower.includes('audit') || lower.includes('compliant'))
    return 'validation';

  if (lower.includes('competitor') || lower.includes('benchmark') || lower.includes('market position'))
    return 'competitive_analysis';

  if (lower.includes('proposal') || lower.includes('distributor') || lower.includes('pitch') || lower.includes('present'))
    return 'proposal';

  // Default: quick lookup for simple questions
  return 'quick_lookup';
}

/**
 * Get the pipeline stages needed for a given task type.
 * Quick lookups skip most stages. Full proposals run everything.
 */
export function getPricingStages(taskType: PricingTaskType): PricingPipelineStage[] {
  switch (taskType) {
    case 'quick_lookup':
      return ['data_pull', 'calculate', 'opus_review', 'present'];

    case 'validation':
      return ['calculate', 'validate', 'opus_review', 'present'];

    case 'comparison':
      return ['data_pull', 'calculate', 'validate', 'director_review', 'opus_review', 'present'];

    case 'proposal':
      return ['intake', 'data_pull', 'calculate', 'validate', 'sales_context', 'director_review', 'opus_review', 'present'];

    case 'new_state_setup':
      return ['intake', 'data_pull', 'calculate', 'validate', 'sales_context', 'director_review', 'opus_review', 'present'];

    case 'price_adjustment':
      return ['intake', 'data_pull', 'calculate', 'validate', 'sales_context', 'director_review', 'opus_review', 'present'];

    case 'competitive_analysis':
      return ['intake', 'data_pull', 'sales_context', 'director_review', 'opus_review', 'present'];
  }
}

/**
 * Pricing-specific review checklist for Opus.
 * Goes beyond the generic 5-point review.
 */
export function buildPricingReviewPrompt(
  taskType: PricingTaskType,
  stateCode: string,
  agentOutput: string,
  originalPrompt: string
): string {
  return [
    `## Pricing Review — ${stateCode} (${taskType})`,
    ``,
    `**Original Request:** ${originalPrompt}`,
    ``,
    `**Agent Output:**`,
    agentOutput,
    ``,
    `## Pricing-Specific Review Checklist`,
    ``,
    `### 1. MARGIN FLOOR CHECK`,
    `Is every SKU at or above the 30% margin floor? This is a HARD STOP.`,
    `Flag ANY SKU below 30% — this is non-negotiable per pricing philosophy.`,
    ``,
    `### 2. SRP TARGET ALIGNMENT`,
    `Do the calculated SRPs hit our targets?`,
    `| SKU | Target SRP |`,
    `|-----|-----------|`,
    `| Plata | $45-50 |`,
    `| Reposado | $55 |`,
    `| Anejo | $90-95 |`,
    `| Supremo | $69-80 |`,
    `| Rebel Cask | $85-99 |`,
    `| Vivo | $129 |`,
    `| Muerto | $130 |`,
    `| Ceramico | $199.99 |`,
    `| Chisme | ~$27 USD / ~$40 CAD |`,
    ``,
    `### 3. STATE-SPECIFIC COMPLIANCE`,
    `- Is the state type correct (control vs open/three-tier)?`,
    `- Are excise taxes accurate for this state?`,
    `- Is channel pricing correctly handled (allowed vs prohibited)?`,
    `- Are there state-specific regulations the agent may have missed?`,
    ``,
    `### 4. FOB CHANGE PROTOCOL`,
    taskType === 'price_adjustment' ? [
      `- Does this require a FOB change?`,
      `- If yes: 60-day lead time reminder + pricing@prestigebevgroup.com notification`,
      `- Has the team been consulted?`,
    ].join('\n') : `N/A for this task type.`,
    ``,
    `### 5. SALES DATA CROSS-CHECK`,
    `- Do the numbers align with what we've seen in recent VIP iDig / Prestige data?`,
    `- Is there depletion context that would change the recommendation?`,
    `- Any red flags from recent sales intel that affect this pricing?`,
    ``,
    `### 6. COMPETITIVE POSITION`,
    `- How does the proposed SRP compare to Espolòn, Olmeca Altos, Casamigos in this state?`,
    `- Are we priced competitively for our tier?`,
    ``,
    `### 7. CONFIDENCE RATING`,
    `Rate your confidence in this output:`,
    `- HIGH — Numbers are solid, compliance is verified, ready for Alex`,
    `- MEDIUM — Mostly good but specific items need Alex's input or verification`,
    `- LOW — Significant gaps, recommend re-running with more data`,
    ``,
    `**Recommendation:** APPROVE | ANNOTATE | REVISE | REDO`,
  ].join('\n');
}

/**
 * Key contacts for pricing operations.
 */
export const PRICING_CONTACTS = {
  fobChanges: 'pricing@prestigebevgroup.com',
  coo: 'Monica Sanita (COO) — finance, vendor forms, control state lead',
  marketCoord: 'Nick Henry — market-level pricing coordination',
  canadaOps: 'Rick Harper — Canadian operations data (provincial portals)',
} as const;

/**
 * Pricing engine CLI commands reference.
 * State agents use these to generate calculations.
 */
export const PRICING_ENGINE_COMMANDS = {
  calculate: 'python3 pricing_engine.py calculate <sku> --fob <price> --state <ST>',
  validate: 'python3 pricing_engine.py validate --fob <price> --cogs <cost> --sku <sku> --srp <price>',
  virginia: 'python3 pricing_engine.py virginia <fob>',
  tree: 'python3 pricing_engine.py tree <sku>',
  newState: 'python3 pricing_engine.py new-state <ST> --type <control|three-tier>',
  compare: 'python3 pricing_engine.py compare <sku> --states <ST1,ST2,...>',
  lookup: 'python3 pricing_engine.py lookup <query>',
  skus: 'python3 pricing_engine.py skus',
  states: 'python3 pricing_engine.py states',
} as const;
