/**
 * Vault Client — Fetches live data from the Siempre Data Vault on Optimus.
 *
 * The vault API serves pre-computed JSON from the daily pipeline.
 * Accessible via Tailscale at http://optimus:8090.
 *
 * Used by the Sales Intel department to inject real data into agent prompts
 * so agents respond with actual numbers, not training-data hallucinations.
 */

const VAULT_BASE = process.env.VAULT_API_URL || 'http://optimus:8090';
const TIMEOUT_MS = 10_000;

export interface VaultHealth {
  status: string;
  vault_exists: boolean;
  last_updated: string | null;
  pipeline_run: string | null;
}

export interface MarketData {
  market: string;
  [key: string]: unknown;
}

export interface VarianceRow {
  period: string;
  market: string;
  sku: string | null;
  metric: string;
  target: number;
  actual: number | null;
  variance_pct: number | null;
  status: string | null;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(`${VAULT_BASE}${path}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

/** Check if the vault API is reachable and fresh. */
export async function checkVaultHealth(): Promise<VaultHealth | null> {
  return fetchJson<VaultHealth>('/health');
}

/** Get the full business snapshot. */
export async function getSummary(): Promise<Record<string, unknown> | null> {
  return fetchJson('/summary');
}

/** Get data for a specific market (e.g., "ontario", "georgia", "california"). */
export async function getMarket(name: string): Promise<MarketData | null> {
  return fetchJson<MarketData>(`/market/${encodeURIComponent(name)}`);
}

/** Get the markets index (coverage status for all markets). */
export async function getMarketsIndex(): Promise<Record<string, unknown> | null> {
  return fetchJson('/markets');
}

/** Get AR aging data. */
export async function getAR(): Promise<Record<string, unknown> | null> {
  return fetchJson('/financials/ar');
}

/** Get variance data (forecast vs actual). */
export async function getVariance(): Promise<{ variance: VarianceRow[]; total_rows: number } | null> {
  return fetchJson('/forecasts/variance');
}

/** Get pipeline status (last 5 runs). */
export async function getPipelineStatus(): Promise<Record<string, unknown> | null> {
  return fetchJson('/status');
}

/**
 * Build a data context block for a Sales Intel agent prompt.
 * Fetches relevant vault data and formats it as text that can be
 * injected into the agent's system prompt or task prompt.
 *
 * @param markets - Optional list of market names to include. If empty, includes summary only.
 * @returns Formatted text block with live data, or null if vault is down.
 */
export async function buildDataContext(markets?: string[]): Promise<string | null> {
  const health = await checkVaultHealth();
  if (!health || health.status !== 'ok') {
    return null;
  }

  const lines: string[] = [
    '## LIVE DATA FROM VAULT (as of pipeline run)',
    `Last updated: ${health.last_updated || 'unknown'}`,
    '',
  ];

  // Always include summary
  const summary = await getSummary();
  if (summary) {
    lines.push('### Business Snapshot');
    lines.push(JSON.stringify(summary, null, 2).slice(0, 3000));
    lines.push('');
  }

  // Include specific market data if requested
  if (markets && markets.length > 0) {
    for (const m of markets) {
      const data = await getMarket(m);
      if (data) {
        lines.push(`### Market: ${m}`);
        lines.push(JSON.stringify(data, null, 2).slice(0, 2000));
        lines.push('');
      }
    }
  }

  // Include variance for requested markets
  const variance = await getVariance();
  if (variance && variance.variance) {
    const relevant = markets && markets.length > 0
      ? variance.variance.filter(r => r.actual !== null && markets.includes(r.market))
      : variance.variance.filter(r => r.actual !== null).slice(0, 50);

    if (relevant.length > 0) {
      lines.push('### Forecast vs Actual (rows with data)');
      for (const r of relevant) {
        const sku = r.sku || 'ALL';
        const var_str = r.variance_pct !== null ? `${r.variance_pct > 0 ? '+' : ''}${r.variance_pct}%` : 'n/a';
        lines.push(`  ${r.period} | ${r.market} | ${sku} | target=${r.target} | actual=${r.actual} | ${var_str} ${r.status || ''}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Extract market names from a natural language prompt.
 * Used to determine which markets to fetch from the vault.
 */
export function extractMarkets(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const markets: string[] = [];

  // US states
  const stateMap: Record<string, string> = {
    'alabama': 'alabama', 'arizona': 'arizona', 'arkansas': 'arkansas',
    'california': 'california', 'colorado': 'colorado', 'connecticut': 'connecticut',
    'florida': 'florida', 'georgia': 'georgia', 'hawaii': 'hawaii',
    'illinois': 'illinois', 'indiana': 'indiana', 'iowa': 'iowa',
    'kansas': 'kansas', 'kentucky': 'kentucky', 'louisiana': 'louisiana',
    'maine': 'maine', 'maryland': 'maryland', 'massachusetts': 'massachusetts',
    'michigan': 'michigan', 'minnesota': 'minnesota', 'mississippi': 'mississippi',
    'missouri': 'missouri', 'montana': 'montana', 'nebraska': 'nebraska',
    'nevada': 'nevada', 'new hampshire': 'new-hampshire', 'new jersey': 'new-jersey',
    'new york': 'new-york', 'north carolina': 'north-carolina',
    'north dakota': 'north-dakota', 'ohio': 'ohio', 'oklahoma': 'oklahoma',
    'oregon': 'oregon', 'south carolina': 'south-carolina',
    'south dakota': 'south-dakota', 'tennessee': 'tennessee', 'texas': 'texas',
    'virginia': 'virginia', 'washington': 'washington', 'wisconsin': 'wisconsin',
    'wyoming': 'wyoming',
    // Canadian provinces
    'ontario': 'ontario', 'alberta': 'alberta', 'british columbia': 'british-columbia',
    'manitoba': 'manitoba', 'saskatchewan': 'saskatchewan',
  };

  for (const [name, key] of Object.entries(stateMap)) {
    if (lower.includes(name)) markets.push(key);
  }

  return Array.from(new Set(markets));
}
