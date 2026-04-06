/**
 * Sales Scorecard — Weekly KPI Rollup Engine
 *
 * The Sales Director aggregates 11 KPIs from Tier 1+2 market agents
 * into a single executive scorecard. Each market is scored using the
 * tiered rules from the foundation document:
 *
 *   A Markets (6): 5-factor → GREEN/YELLOW/RED
 *   B Markets (12): 3-factor → GREEN/YELLOW/RED
 *   C Markets (35): 1-factor + dark market alert
 *
 * Output: Executive-ready markdown with RED markets first,
 * then YELLOW, then GREEN — matching the Market Health Briefing format.
 */

// ============================================================================
// TYPES
// ============================================================================

export type HealthColor = 'RED' | 'YELLOW' | 'GREEN';
export type MarketGrade = 'A' | 'B' | 'C';

export interface KPIEntry {
  metric: string;
  target: number | string;
  actual: number | string | null;
  weight: number;
  variance: number | null;       // % variance from target (negative = miss)
  healthFlag: HealthColor | null;
}

export interface MarketScorecard {
  market: string;
  code: string;
  grade: MarketGrade;
  tier: 'tier1' | 'tier2' | 'phase3';
  distributor: string;
  kpis: KPIEntry[];
  weightedScore: number;         // 0-100
  health: HealthColor;
  healthFactors: {
    pctToTarget: HealthColor | null;
    reorderRate: HealthColor | null;
    pipelineCoverage: HealthColor | null;
    coreSkuMix: HealthColor | null;     // A markets only
    spendPerCase: HealthColor | null;    // A markets only
  };
  alerts: string[];
  recommendations: string[];
}

export interface ScorecardRollup {
  period: string;               // e.g., "Week of Apr 7, 2026"
  generatedAt: string;
  totalMarkets: number;
  activeMarkets: number;
  redMarkets: MarketScorecard[];
  yellowMarkets: MarketScorecard[];
  greenMarkets: MarketScorecard[];
  darkMarkets: string[];         // Markets with 0 depletions after prior activity
  nationalKPIs: {
    totalDepletions: number | null;
    totalTarget: number | null;
    pctToTarget: number | null;
    avgReorderRate: number | null;
    avgPipelineCoverage: number | null;
    coreSkuMixNational: number | null;
  };
  executiveSummary: string;
}

// ============================================================================
// KPI DEFINITIONS — The 11 metrics from the foundation doc
// ============================================================================

export const KPI_DEFINITIONS = [
  { id: 'depletions', name: 'Depletions (cases)', defaultTarget: 50, weight: 20 },
  { id: 'new_pods', name: 'New PODs', defaultTarget: 3, weight: 12 },
  { id: 'menu_wins', name: 'Menu / Backbar Wins', defaultTarget: 2, weight: 10 },
  { id: 'displays', name: 'Displays / Features', defaultTarget: 2, weight: 10 },
  { id: 'price_compliance', name: 'Price Compliance %', defaultTarget: 95, weight: 10 },
  { id: 'ride_withs', name: 'Distributor Ride-With Days', defaultTarget: 2, weight: 8 },
  { id: 'account_calls', name: 'Account Calls', defaultTarget: 12, weight: 8 },
  { id: 'chain_followups', name: 'Chain Follow-Ups', defaultTarget: 5, weight: 7 },
  { id: 'issues_closed', name: 'Past Due Issues Closed', defaultTarget: 4, weight: 5 },
  { id: 'forecast_accuracy', name: 'Forecast Accuracy %', defaultTarget: 90, weight: 5 },
  { id: 'trade_spend', name: 'Trade Spend Within Guardrails %', defaultTarget: 100, weight: 5 },
] as const;

// ============================================================================
// MARKET CLASSIFICATION
// ============================================================================

/** A Markets: Top 6, 5-factor scoring */
const A_MARKETS = new Set(['ON', 'GA', 'AB', 'NC', 'CA', 'FL']);

/** B Markets: 12, 3-factor scoring */
const B_MARKETS = new Set(['AZ', 'BC', 'CT', 'HI', 'IN', 'MI', 'MN', 'NY', 'OK', 'SC', 'TX', 'VA']);

export function getMarketGrade(code: string): MarketGrade {
  if (A_MARKETS.has(code)) return 'A';
  if (B_MARKETS.has(code)) return 'B';
  return 'C';
}

// ============================================================================
// HEALTH SCORING
// ============================================================================

export interface HealthInput {
  pctToTarget: number | null;      // % of annual target achieved to date
  reorderRate: number | null;      // % of accounts with 2+ orders in 90 days
  pipelineCoverage: number | null; // distributor inventory / monthly depletion rate
  coreSkuMix: number | null;      // (plata + repo + anejo) / total depletions
  spendPerCase: number | null;    // (brand dev + DA) / cases depleted
}

function scoreFactorPctToTarget(pct: number | null, grade: MarketGrade): HealthColor | null {
  if (pct === null) return null;
  if (pct >= 95) return 'GREEN';
  if (grade === 'C') return pct >= 70 ? 'YELLOW' : 'RED';
  return pct >= 85 ? 'YELLOW' : 'RED';
}

function scoreFactorReorderRate(rate: number | null): HealthColor | null {
  if (rate === null) return null;
  if (rate >= 50) return 'GREEN';
  if (rate >= 40) return 'YELLOW';
  return 'RED';
}

function scoreFactorPipelineCoverage(coverage: number | null): HealthColor | null {
  if (coverage === null) return null;
  if (coverage >= 3.0) return 'GREEN';
  if (coverage >= 2.0) return 'YELLOW';
  return 'RED';
}

function scoreFactorCoreSkuMix(mix: number | null): HealthColor | null {
  if (mix === null) return null;
  if (mix >= 80) return 'GREEN';
  if (mix >= 70) return 'YELLOW';
  return 'RED';
}

function scoreFactorSpendPerCase(spend: number | null): HealthColor | null {
  if (spend === null) return null;
  if (spend <= 15) return 'GREEN';
  if (spend <= 20) return 'YELLOW';
  return 'RED';
}

/**
 * Score a market's overall health using the tiered rules.
 */
export function scoreMarketHealth(code: string, input: HealthInput): {
  health: HealthColor;
  factors: MarketScorecard['healthFactors'];
} {
  const grade = getMarketGrade(code);
  const factors: MarketScorecard['healthFactors'] = {
    pctToTarget: scoreFactorPctToTarget(input.pctToTarget, grade),
    reorderRate: scoreFactorReorderRate(input.reorderRate),
    pipelineCoverage: scoreFactorPipelineCoverage(input.pipelineCoverage),
    coreSkuMix: grade === 'A' ? scoreFactorCoreSkuMix(input.coreSkuMix) : null,
    spendPerCase: grade === 'A' ? scoreFactorSpendPerCase(input.spendPerCase) : null,
  };

  // Count GREEN factors
  const allFactors = Object.values(factors).filter((v): v is HealthColor => v !== null);
  const greenCount = allFactors.filter(v => v === 'GREEN').length;

  let health: HealthColor;

  if (grade === 'A') {
    // 5-factor: >=5 GREEN = GREEN, >=3 = YELLOW, else RED
    health = greenCount >= 5 ? 'GREEN' : greenCount >= 3 ? 'YELLOW' : 'RED';
  } else if (grade === 'B') {
    // 3-factor: >=3 GREEN = GREEN, >=2 = YELLOW, else RED
    health = greenCount >= 3 ? 'GREEN' : greenCount >= 2 ? 'YELLOW' : 'RED';
  } else {
    // C markets: just pctToTarget
    health = factors.pctToTarget || 'RED';
  }

  return { health, factors };
}

// ============================================================================
// SCORECARD MARKDOWN GENERATION
// ============================================================================

/**
 * Generate the executive scorecard markdown from a rollup.
 */
export function generateScorecardMarkdown(rollup: ScorecardRollup): string {
  const lines: string[] = [];

  lines.push(`# Siempre Spirits — Weekly Sales Scorecard`);
  lines.push(`**${rollup.period}** | Generated: ${rollup.generatedAt}`);
  lines.push('');

  // The Number
  if (rollup.nationalKPIs.totalDepletions !== null && rollup.nationalKPIs.totalTarget !== null) {
    const pct = rollup.nationalKPIs.pctToTarget !== null
      ? `(${rollup.nationalKPIs.pctToTarget.toFixed(1)}% to target)`
      : '';
    lines.push(`## The Number`);
    lines.push(`**${rollup.nationalKPIs.totalDepletions.toLocaleString()} cases** depleted vs **${rollup.nationalKPIs.totalTarget.toLocaleString()} target** ${pct}`);
    lines.push('');
  }

  // Executive Summary
  lines.push(`## Executive Summary`);
  lines.push(rollup.executiveSummary);
  lines.push('');

  // Health Overview
  lines.push(`## Health Overview`);
  lines.push(`| Status | Count | Markets |`);
  lines.push(`|--------|-------|---------|`);
  lines.push(`| 🔴 RED | ${rollup.redMarkets.length} | ${rollup.redMarkets.map(m => m.code).join(', ') || 'None'} |`);
  lines.push(`| 🟡 YELLOW | ${rollup.yellowMarkets.length} | ${rollup.yellowMarkets.map(m => m.code).join(', ') || 'None'} |`);
  lines.push(`| 🟢 GREEN | ${rollup.greenMarkets.length} | ${rollup.greenMarkets.map(m => m.code).join(', ') || 'None'} |`);
  if (rollup.darkMarkets.length > 0) {
    lines.push(`| ⚫ DARK | ${rollup.darkMarkets.length} | ${rollup.darkMarkets.join(', ')} |`);
  }
  lines.push('');

  // RED Markets — Full detail
  if (rollup.redMarkets.length > 0) {
    lines.push(`## 🔴 Needs Attention (RED)`);
    for (const m of rollup.redMarkets) {
      lines.push(`### ${m.market} (${m.code}) — ${m.distributor}`);
      lines.push(`Grade: ${m.grade} | Weighted Score: ${m.weightedScore}/100`);
      if (m.alerts.length > 0) {
        lines.push(`**Alerts:** ${m.alerts.join('; ')}`);
      }
      if (m.recommendations.length > 0) {
        lines.push(`**Actions:** ${m.recommendations.join('; ')}`);
      }
      lines.push('');
    }
  }

  // YELLOW Markets — Summary table
  if (rollup.yellowMarkets.length > 0) {
    lines.push(`## 🟡 Watch List (YELLOW)`);
    lines.push(`| Market | Distributor | Score | Key Concern |`);
    lines.push(`|--------|-------------|-------|-------------|`);
    for (const m of rollup.yellowMarkets) {
      const concern = m.alerts[0] || 'Below threshold';
      lines.push(`| ${m.code} | ${m.distributor} | ${m.weightedScore}/100 | ${concern} |`);
    }
    lines.push('');
  }

  // GREEN Markets — Brief
  if (rollup.greenMarkets.length > 0) {
    lines.push(`## 🟢 On Track (GREEN)`);
    lines.push(`| Market | Distributor | Score |`);
    lines.push(`|--------|-------------|-------|`);
    for (const m of rollup.greenMarkets) {
      lines.push(`| ${m.code} | ${m.distributor} | ${m.weightedScore}/100 |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Create an empty scorecard rollup scaffold.
 * Market agents fill in their data; the Sales Director runs the scoring.
 */
export function createEmptyScorecardRollup(period: string): ScorecardRollup {
  return {
    period,
    generatedAt: new Date().toISOString(),
    totalMarkets: 55,
    activeMarkets: 20, // Tier 1 + Tier 2
    redMarkets: [],
    yellowMarkets: [],
    greenMarkets: [],
    darkMarkets: [],
    nationalKPIs: {
      totalDepletions: null,
      totalTarget: null,
      pctToTarget: null,
      avgReorderRate: null,
      avgPipelineCoverage: null,
      coreSkuMixNational: null,
    },
    executiveSummary: '',
  };
}
