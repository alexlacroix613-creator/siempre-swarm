/**
 * Sales Intelligence Pipeline — Data collection → Analysis → Briefing.
 *
 * Each source agent (VIP, Winebow, Oklahoma, Canada, Prestige) specializes
 * in extracting and interpreting data from their specific portal/system.
 * Intel Director synthesizes across sources.
 * Opus reviews for accuracy and strategic implications.
 *
 * Pipeline:
 *   1. REQUEST — What data does Alex need? What time period? What markets?
 *   2. SOURCE_DISPATCH — Route to the right source agent(s)
 *   3. DATA_EXTRACT — Source agents pull their data (may involve Manus for headless browsing)
 *   4. NORMALIZE — Convert to common format (cases, revenue, period)
 *   5. DIRECTOR_SYNTHESIS — Intel Director cross-references, identifies trends/anomalies
 *   6. OPUS_REVIEW — I verify plausibility, flag conflicts with recent context
 *   7. BRIEF — Deliver market briefing to Alex
 */

export const SALES_INTEL_PIPELINE_STAGES = [
  'request',           // What data? What period? What markets?
  'source_dispatch',   // Route to VIP, Winebow, OK, Canada, Prestige agents
  'data_extract',      // Source agents pull data (headless browsing if needed)
  'normalize',         // Common format: market, SKU, period, cases, revenue
  'director_synthesis',// Cross-reference, trend analysis, anomaly detection
  'opus_review',       // Plausibility check, context from recent sessions
  'brief',             // Market briefing delivered to Alex
] as const;

export type SalesIntelStage = typeof SALES_INTEL_PIPELINE_STAGES[number];

export type SalesIntelTaskType =
  | 'quick_check'       // "How's Tennessee doing?" — fast path
  | 'market_briefing'   // Full market report for one or more states
  | 'trend_analysis'    // Period-over-period comparison
  | 'anomaly_hunt'      // "Anything weird in the data?"
  | 'full_sweep';       // All sources, all markets — comprehensive

export function classifySalesIntelTask(prompt: string): SalesIntelTaskType {
  const lower = prompt.toLowerCase();

  if (lower.includes('trend') || lower.includes('over time') || lower.includes('compared to'))
    return 'trend_analysis';
  if (lower.includes('anomal') || lower.includes('weird') || lower.includes('flag') || lower.includes('issue'))
    return 'anomaly_hunt';
  if (lower.includes('full') || lower.includes('all markets') || lower.includes('comprehensive') || lower.includes('sweep'))
    return 'full_sweep';
  if (lower.includes('briefing') || lower.includes('report') || lower.includes('summary'))
    return 'market_briefing';

  return 'quick_check';
}

export function getSalesIntelStages(taskType: SalesIntelTaskType): SalesIntelStage[] {
  switch (taskType) {
    case 'quick_check':
      return ['source_dispatch', 'data_extract', 'opus_review', 'brief'];
    case 'market_briefing':
      return ['request', 'source_dispatch', 'data_extract', 'normalize', 'director_synthesis', 'opus_review', 'brief'];
    case 'trend_analysis':
      return ['request', 'source_dispatch', 'data_extract', 'normalize', 'director_synthesis', 'opus_review', 'brief'];
    case 'anomaly_hunt':
      return ['source_dispatch', 'data_extract', 'normalize', 'director_synthesis', 'opus_review', 'brief'];
    case 'full_sweep':
      return ['request', 'source_dispatch', 'data_extract', 'normalize', 'director_synthesis', 'opus_review', 'brief'];
  }
}

/**
 * Map data questions to the right source agent(s).
 */
export function routeToSourceAgents(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const agents: string[] = [];

  if (lower.includes('depletion') || lower.includes('cases') || lower.includes('distribution') ||
      lower.match(/\b(us|united states|domestic)\b/))
    agents.push('agent_vip_idig');

  if (lower.includes('california') || lower.includes('ca ') || lower.includes('winebow') || lower.includes('diverport'))
    agents.push('agent_winebow');

  if (lower.includes('oklahoma') || lower.includes(' ok ') || lower.includes('able commission'))
    agents.push('agent_oklahoma');

  if (lower.includes('canada') || lower.includes('ontario') || lower.includes('lcbo') ||
      lower.includes('quebec') || lower.includes('saq') || lower.includes('bc ') || lower.includes('bcldb') ||
      lower.includes('provincial') || lower.includes('alberta') || lower.includes('manitoba') || lower.includes('saskatchewan'))
    agents.push('agent_canada');

  if (lower.includes('prestige') || lower.includes('nwow') || lower.includes('shipment') || lower.includes('revenue'))
    agents.push('agent_prestige');

  // Default: if no specific source matched, send to Intel Director
  return agents.length > 0 ? agents : ['sales_intel_director'];
}

/**
 * Sales Intel review checklist for Opus.
 */
export function buildSalesIntelReviewPrompt(
  taskType: SalesIntelTaskType,
  agentOutput: string,
  originalPrompt: string
): string {
  return [
    `## Sales Intelligence Review (${taskType})`,
    ``,
    `**Original Request:** ${originalPrompt}`,
    ``,
    `**Agent Output:**`,
    agentOutput,
    ``,
    `## Sales Intel-Specific Review Checklist`,
    ``,
    `### 1. DATA SOURCE VERIFICATION`,
    `- Which source(s) did the agent cite? (VIP iDig, Winebow, OK portal, Provincial, Prestige)`,
    `- Is the data period clearly stated?`,
    `- Are we comparing apples to apples (same period lengths, same SKU definitions)?`,
    ``,
    `### 2. NUMBER PLAUSIBILITY`,
    `- Do the case volumes make sense for this market size?`,
    `- Are the growth/decline percentages reasonable?`,
    `- Any numbers that seem too round (made up) vs specific (real data)?`,
    ``,
    `### 3. CROSS-SOURCE CONSISTENCY`,
    `- If multiple sources were used, do they tell the same story?`,
    `- Prestige shipments should roughly track with VIP depletions (with lag)`,
    `- Flag any ship-depl gaps that seem unusual`,
    ``,
    `### 4. STRATEGIC IMPLICATIONS`,
    `- What does this data mean for pricing decisions?`,
    `- Are there action items Alex should consider?`,
    `- Does this change any active distributor relationships?`,
    ``,
    `### 5. CONFIDENCE RATING`,
    `- HIGH — Data is sourced, numbers are plausible, analysis is sound`,
    `- MEDIUM — Analysis is reasonable but data needs fresh pull to verify`,
    `- LOW — Agent is working from training data, not real numbers — flag clearly`,
    ``,
    `**Recommendation:** APPROVE | ANNOTATE | REVISE | REDO`,
  ].join('\n');
}

/**
 * Data source reference for source agents.
 */
export const DATA_SOURCES = {
  vip_idig: {
    name: 'VIP iDig',
    url: 'reports.vtinfo.com',
    coverage: '28 US states (excludes CA)',
    dataTypes: ['depletions', 'cases', 'distribution', 'velocity', 'reorder rates'],
    accessMethod: 'Browser automation (Manus)',
    localPath: './data/vipidig/{YYYY-MM}/',
  },
  winebow: {
    name: 'Winebow DiverPort',
    url: 'bi.winebow.com',
    coverage: 'California (NoCa/SoCa), regional',
    dataTypes: ['depletions', 'inventory', 'accounts sold', 'on/off-premise split'],
    accessMethod: 'Browser automation (Manus)',
    localPath: './data/diveport/{YYYY-MM}/',
  },
  oklahoma: {
    name: 'Oklahoma State Portal',
    coverage: 'Oklahoma only',
    dataTypes: ['compliance', 'sales reporting'],
    accessMethod: 'Browser automation (Manus)',
    localPath: './data/provincial/{YYYY-MM}/',
  },
  canada: {
    name: 'Canadian Provincial Portals',
    coverage: 'ON (LCBO), QC (SAQ), BC (BCLDB), AB, MB, SK',
    dataTypes: ['depletions', 'inventory', 'listings', 'revenue in CAD'],
    accessMethod: 'Browser automation (Manus)',
    localPath: './data/provincial/{YYYY-MM}/',
  },
  prestige: {
    name: 'Prestige NWOW',
    coverage: 'All markets (shipment side)',
    dataTypes: ['FOB actuals', 'billbacks', 'brand dev spend', 'DA', 'shipment volumes'],
    accessMethod: 'Gmail attachment parsing',
    localPath: './data/prestige/{YYYY-MM}/prestige_parsed.json',
  },
  zoho: {
    name: 'Zoho Books',
    coverage: 'All markets (invoice side)',
    dataTypes: ['invoices', 'accounts receivable', 'revenue by distributor'],
    accessMethod: 'Maton gateway (zoho-books)',
    localPath: './data/zoho/{YYYY-MM}/zoho_revenue.json',
  },
} as const;
