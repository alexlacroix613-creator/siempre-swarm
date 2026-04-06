/**
 * Sales Data Bridge — Connects Sales Intel data feeds to Market Agents.
 *
 * This is the integration layer between:
 *   - Data Vault (Optimus pipeline output → live market data)
 *   - Sales Intel pipeline (VIP iDig, DiverPort, Prestige, Provincial, Zoho)
 *   - Market Agents (need data context injected into their prompts)
 *
 * When a market agent is activated, this bridge:
 *   1. Fetches live vault data for that market
 *   2. Reads the agent's dossier from disk
 *   3. Reads the foundation document
 *   4. Combines all three into a complete context block
 *
 * The market agent then operates with: foundation + dossier + live data.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { buildDataContext, getMarket, checkVaultHealth } from '../data/vault-client.js';
import { getMarketDossierPath, getMarketCounts } from './sales-department.js';
import { getAgentContextFiles } from './sales-pipeline.js';

// ============================================================================
// CONTEXT ASSEMBLY
// ============================================================================

const SWARM_ROOT = resolve(process.cwd());

/**
 * Read a file from the sales-force data directory.
 * Returns content or a "not found" notice.
 */
function readSalesForceFile(relativePath: string): string {
  const fullPath = resolve(SWARM_ROOT, relativePath);
  if (!existsSync(fullPath)) {
    return `[FILE NOT FOUND: ${relativePath}]`;
  }
  return readFileSync(fullPath, 'utf-8');
}

/**
 * Build the complete context for a market agent.
 *
 * Layers:
 *   1. Foundation document (shared knowledge — compliance, KPIs, onboarding)
 *   2. Market dossier (distributor, contacts, pricing, history, risk flags)
 *   3. Live vault data (depletions, inventory, forecasts — if vault is up)
 *
 * @param agentId - The market agent ID (e.g., "sales_ga")
 * @param includeVaultData - Whether to fetch live data from the vault (default: true)
 * @returns Complete context string for injection into agent prompt
 */
export async function buildMarketAgentContext(
  agentId: string,
  includeVaultData: boolean = true,
): Promise<string> {
  const files = getAgentContextFiles(agentId);
  const sections: string[] = [];

  // Layer 1: Foundation
  const foundation = readSalesForceFile(files.foundation);
  if (foundation.startsWith('[FILE NOT FOUND')) {
    sections.push('⚠️ FOUNDATION DOCUMENT NOT LOADED — operating with dossier only');
  } else {
    // Truncate to key sections to save tokens (full doc is 35KB)
    // Market agents don't need the full regulatory table — their dossier has their state's details
    const truncated = extractFoundationEssentials(foundation);
    sections.push('# FOUNDATION CONTEXT (Key Sections)');
    sections.push(truncated);
  }

  // Layer 2: Market Dossier
  const dossier = readSalesForceFile(files.dossier);
  if (dossier.startsWith('[FILE NOT FOUND')) {
    sections.push(`⚠️ DOSSIER NOT FOUND for ${agentId}. Operating with foundation only.`);
  } else {
    sections.push('# YOUR MARKET DOSSIER');
    sections.push(dossier);
  }

  // Layer 3: Live Vault Data
  if (includeVaultData) {
    const marketName = agentIdToMarketName(agentId);
    if (marketName) {
      const vaultData = await buildDataContext([marketName]);
      if (vaultData) {
        sections.push('# LIVE DATA (From Vault Pipeline)');
        sections.push(vaultData);
      } else {
        sections.push('# LIVE DATA: Vault unavailable. Rely on dossier data.');
      }
    }
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Extract essential foundation sections for a market agent.
 * Full doc is 35KB — agents only need company context, KPIs, escalation matrix.
 */
function extractFoundationEssentials(foundation: string): string {
  const essentials: string[] = [];

  // Extract key sections by header
  const sections: Record<string, boolean> = {
    '## 1. Company & Brand Overview': true,
    '## 6. Critical Operational SOPs': true,
    '## 8. Weekly Scorecard Template': true,
    '## 11. Escalation Matrix': true,
  };

  const lines = foundation.split('\n');
  let capturing = false;
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      capturing = !!sections[line.trim()];
      currentSection = line.trim();
    }
    if (capturing) {
      essentials.push(line);
    }
  }

  return essentials.join('\n') || foundation.slice(0, 5000);
}

/**
 * Map agent ID to market name for vault API.
 */
function agentIdToMarketName(agentId: string): string | null {
  const code = agentId.replace('sales_', '').toUpperCase();
  const nameMap: Record<string, string> = {
    'CA': 'california', 'TX': 'texas', 'CO': 'colorado', 'WA': 'washington',
    'OR': 'oregon', 'FL': 'florida', 'IL': 'illinois', 'GA': 'georgia',
    'KS': 'kansas', 'OK': 'oklahoma', 'TN': 'tennessee', 'AR': 'arkansas',
    'MO': 'missouri', 'VA': 'virginia', 'UT': 'utah',
    'ON': 'ontario', 'AB': 'alberta', 'SK': 'saskatchewan',
    'MB': 'manitoba', 'BC': 'british-columbia',
  };
  return nameMap[code] || null;
}

/**
 * Build context for the Sales Director (cross-market view).
 * Lighter per-market data, heavier on summary + variance.
 */
export async function buildDirectorContext(): Promise<string> {
  const sections: string[] = [];

  // Business snapshot from vault
  const health = await checkVaultHealth();
  if (health && health.status === 'ok') {
    const fullContext = await buildDataContext();
    if (fullContext) {
      sections.push('# LIVE DATA SUMMARY');
      sections.push(fullContext);
    }
  } else {
    sections.push('# VAULT STATUS: Offline or unreachable. Using memory-based context.');
  }

  // Market counts for context
  const counts = getMarketCounts();
  sections.push(`# SALES FORCE STATUS`);
  sections.push(`Tier 1: ${counts.tier1} markets | Tier 2: ${counts.tier2} markets | Phase 3: ${counts.phase3} shells | Total: ${counts.total}`);

  return sections.join('\n\n---\n\n');
}

/**
 * Quick check: is the vault up and serving data?
 */
export async function isVaultAvailable(): Promise<boolean> {
  const health = await checkVaultHealth();
  return !!health && health.status === 'ok';
}
