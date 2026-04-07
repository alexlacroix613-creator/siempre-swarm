/**
 * Mexico Ops Data Bridge — Connects Mexico Operations agents to live data.
 *
 * Data Sources:
 *   - Zoho Books via Maton (MATON_API_KEY) → COGS Analyst
 *   - Gmail/Calendar via Maton (ANA_MATON_KEY) → Production Tracker, Freight
 *   - Monday.com via Maton (ANA_MATON_KEY) → Production Tracker, Barrels, Warehouse
 *   - Pepe WhatsApp digest (localhost:3000 on Optimus) → Production Tracker
 *   - FX rates via exchangerate-api.com → COGS Analyst
 *
 * Pattern: Same as sales-data-bridge.ts — fetches live data, formats it,
 * injects into agent prompts so they respond with real numbers.
 *
 * Privacy: ANA_MATON_KEY scoped to ana-karen@siempretequila.com ONLY.
 * MATON_API_KEY for Zoho/Alex. Never cross-reference.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const MATON_BASE = 'https://gateway.maton.ai';
const TIMEOUT_MS = 15_000;
const SWARM_ROOT = resolve(process.cwd());

// ============================================================================
// MATON HELPERS
// ============================================================================

interface MatonOptions {
  key: string;
  path: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, string>;
}

async function matonFetch<T>(opts: MatonOptions): Promise<T | null> {
  try {
    const url = new URL(`${MATON_BASE}${opts.path}`);
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        url.searchParams.set(k, v);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resp = await fetch(url.toString(), {
      method: opts.method || 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${opts.key}`,
        'Content-Type': 'application/json',
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    });

    clearTimeout(timeout);
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

function getAlexMatonKey(): string | null {
  return process.env.MATON_API_KEY || null;
}

function getAKMatonKey(): string | null {
  return process.env.ANA_MATON_KEY || null;
}

// ============================================================================
// ZOHO BOOKS — COGS DATA
// ============================================================================

interface ZohoBill {
  bill_id: string;
  vendor_name: string;
  bill_number: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
  currency_code: string;
  line_items?: Array<{
    name: string;
    description: string;
    rate: number;
    quantity: number;
    item_total: number;
    unit?: string;
  }>;
}

interface ZohoBillsResponse {
  bills: ZohoBill[];
  page_context?: { total: number; page: number; has_more_page: boolean };
}

/**
 * Fetch recent bills from Zoho Books for COGS analysis.
 * Returns bills from the last N days for specified vendors.
 */
export async function fetchRecentBills(opts?: {
  vendorName?: string;
  days?: number;
  limit?: number;
}): Promise<ZohoBill[]> {
  const key = getAlexMatonKey();
  if (!key) return [];

  const params: Record<string, string> = {
    per_page: String(opts?.limit || 25),
  };

  if (opts?.vendorName) {
    params.vendor_name = opts.vendorName;
  }

  const result = await matonFetch<ZohoBillsResponse>({
    key,
    path: '/zoho-books/books/v3/bills',
    params,
  });

  return result?.bills || [];
}

/**
 * Fetch a single bill with line item detail for per-unit cost extraction.
 */
export async function fetchBillDetail(billId: string): Promise<ZohoBill | null> {
  const key = getAlexMatonKey();
  if (!key) return null;

  const result = await matonFetch<{ bill: ZohoBill }>({
    key,
    path: `/zoho-books/books/v3/bills/${billId}`,
    params: {},
  });

  return result?.bill || null;
}

/**
 * Fetch overdue bills — critical for vendor health monitoring.
 */
export async function fetchOverdueBills(): Promise<ZohoBill[]> {
  const key = getAlexMatonKey();
  if (!key) return [];

  const result = await matonFetch<ZohoBillsResponse>({
    key,
    path: '/zoho-books/books/v3/bills',
    params: {
      status: 'overdue',
      per_page: '50',
    },
  });

  return result?.bills || [];
}

// ============================================================================
// FX RATES — Live currency conversion
// ============================================================================

interface FXRateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

let fxCache: { rates: Record<string, number>; fetchedAt: number } | null = null;

/**
 * Get live MXN/USD exchange rate. Caches for 1 hour.
 * CRITICAL: Never use planning rates. A 1-point MXN move ≈ $1.50/case change.
 */
export async function getFXRate(from: string = 'USD', to: string = 'MXN'): Promise<number | null> {
  // Return cached if < 1 hour old
  if (fxCache && Date.now() - fxCache.fetchedAt < 3600_000) {
    const rate = fxCache.rates[to];
    return rate || null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const resp = await fetch(
      `https://open.er-api.com/v6/latest/${from}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const data = (await resp.json()) as FXRateResponse;

    fxCache = { rates: data.rates, fetchedAt: Date.now() };
    return data.rates[to] || null;
  } catch {
    return null;
  }
}

// ============================================================================
// GMAIL — AK's Email Intelligence
// ============================================================================

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ mimeType: string; body?: { data?: string } }>;
  };
}

interface GmailListResponse {
  messages: Array<{ id: string; threadId: string }>;
  resultSizeEstimate: number;
}

/**
 * Search AK's email for operations-relevant threads.
 */
export async function searchAKEmail(query: string, maxResults: number = 5): Promise<GmailMessage[]> {
  const key = getAKMatonKey();
  if (!key) return [];

  const list = await matonFetch<GmailListResponse>({
    key,
    path: '/google-mail/gmail/v1/users/me/messages',
    params: { q: query, maxResults: String(maxResults) },
  });

  if (!list?.messages) return [];

  // Fetch full messages
  const messages: GmailMessage[] = [];
  for (const msg of list.messages.slice(0, maxResults)) {
    const full = await matonFetch<GmailMessage>({
      key,
      path: `/google-mail/gmail/v1/users/me/messages/${msg.id}`,
      params: { format: 'metadata', metadataHeaders: 'Subject,From,Date' },
    });
    if (full) messages.push(full);
  }

  return messages;
}

// ============================================================================
// MONDAY.COM — Production & Barrel Data
// ============================================================================

interface MondayResponse {
  data: {
    boards?: Array<{
      id: string;
      name: string;
      items_page?: {
        items: Array<{
          id: string;
          name: string;
          group?: { title: string };
          column_values: Array<{
            id: string;
            text: string;
            column?: { title: string };
          }>;
        }>;
      };
    }>;
  };
}

/**
 * Query Monday.com boards via AK's Maton connection.
 */
export async function queryMonday(graphqlQuery: string): Promise<MondayResponse | null> {
  const key = getAKMatonKey();
  if (!key) return null;

  return matonFetch<MondayResponse>({
    key,
    path: '/monday/v2',
    method: 'POST',
    body: { query: graphqlQuery },
  });
}

/**
 * Get barrel inventory from Monday.com board.
 */
export async function getBarrelInventory(): Promise<MondayResponse | null> {
  // Board ID for "Inventory Rebel Cask 1414"
  return queryMonday(`{
    boards(ids: [18395240781]) {
      items_page(limit: 200) {
        items {
          id name
          group { title }
          column_values { id text column { title } }
        }
      }
    }
  }`);
}

/**
 * Get production orders from Monday.com.
 */
export async function getProductionOrders(): Promise<MondayResponse | null> {
  // Board ID for "Purchase Order Production"
  return queryMonday(`{
    boards(ids: [18401486274]) {
      items_page(limit: 100) {
        items {
          id name
          group { title }
          column_values { id text column { title } }
        }
      }
    }
  }`);
}

/**
 * Get AK's task list from Monday.com.
 */
export async function getAKTasks(): Promise<MondayResponse | null> {
  // Board ID for "Ana Karen - Task List"
  return queryMonday(`{
    boards(ids: [18394742521]) {
      items_page(limit: 50) {
        items {
          id name
          group { title }
          column_values { id text column { title } }
          subitems { id name column_values { id text column { title } } }
        }
      }
    }
  }`);
}

// ============================================================================
// PEPE — WhatsApp Digest
// ============================================================================

const PEPE_BASE = process.env.PEPE_URL || 'http://100.103.182.114:3000';

interface PepeDigest {
  messages: Array<{
    from: string;
    text: string;
    timestamp: string;
    group?: string;
  }>;
}

/**
 * Fetch recent WhatsApp digest from Pepe.
 * Pepe produces structured message digests from group-relay.js.
 */
export async function fetchPepeDigest(hours: number = 24): Promise<PepeDigest | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(`${PEPE_BASE}/api/messages?hours=${hours}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    return (await resp.json()) as PepeDigest;
  } catch {
    return null;
  }
}

// ============================================================================
// CONTEXT BUILDERS — Assemble data for specific agents
// ============================================================================

/**
 * Build context for the COGS Analyst.
 * Layers: COGS reference file + live Zoho bills + FX rate + overdue alerts
 */
export async function buildCOGSContext(): Promise<string> {
  const sections: string[] = [];

  // Layer 1: Reference data
  const cogsRef = resolve(SWARM_ROOT, 'data/mexico-ops/zoho-cogs-report.md');
  if (existsSync(cogsRef)) {
    const content = readFileSync(cogsRef, 'utf-8');
    // Truncate to key sections to save tokens
    sections.push('# COGS REFERENCE (Invoice-Backed)');
    sections.push(content.slice(0, 6000));
  }

  // Layer 2: Live FX rate
  const fxRate = await getFXRate('USD', 'MXN');
  if (fxRate) {
    sections.push(`# LIVE FX RATE\nUSD/MXN: ${fxRate.toFixed(4)} (${new Date().toISOString()})`);
  } else {
    sections.push('# FX RATE: Unavailable. Do NOT use planning rates — wait for live rate.');
  }

  // Layer 3: Overdue vendor bills
  const overdue = await fetchOverdueBills();
  if (overdue.length > 0) {
    sections.push('# OVERDUE VENDOR BILLS (ALERT)');
    for (const bill of overdue.slice(0, 10)) {
      sections.push(`  ${bill.vendor_name} | ${bill.bill_number} | ${bill.currency_code} ${bill.balance.toFixed(2)} | Due: ${bill.due_date} | Status: ${bill.status}`);
    }
  }

  // Layer 4: Recent bills from key COGS vendors
  const cogsVendors = ['Viva Mexico', 'VIDRIOFORMAS', 'FUSION Y FORMAS', 'Eidec', 'Amorim', 'Custom Label', 'IGL'];
  for (const vendor of cogsVendors) {
    const bills = await fetchRecentBills({ vendorName: vendor, limit: 3 });
    if (bills.length > 0) {
      sections.push(`## Recent Bills: ${vendor}`);
      for (const b of bills) {
        sections.push(`  ${b.date} | ${b.bill_number} | ${b.currency_code} ${b.total.toFixed(2)} | ${b.status}`);
      }
    }
  }

  return sections.join('\n\n');
}

/**
 * Build context for the Production Tracker.
 * Layers: Production orders (Monday) + AK calendar + Pepe digest + operational state
 */
export async function buildProductionContext(): Promise<string> {
  const sections: string[] = [];

  // Layer 1: Operational state reference
  const opsRef = resolve(SWARM_ROOT, 'data/mexico-ops/operational-state.md');
  if (existsSync(opsRef)) {
    const content = readFileSync(opsRef, 'utf-8');
    sections.push('# OPERATIONAL STATE REFERENCE');
    sections.push(content.slice(0, 4000));
  }

  // Layer 2: Monday.com production orders
  const orders = await getProductionOrders();
  if (orders?.data?.boards?.[0]?.items_page?.items) {
    const items = orders.data.boards[0].items_page.items;
    sections.push('# LIVE PRODUCTION ORDERS (Monday.com)');
    for (const item of items.slice(0, 20)) {
      const group = item.group?.title || 'Unknown Stage';
      const vals = item.column_values
        .filter(cv => cv.text)
        .map(cv => `${cv.column?.title || cv.id}: ${cv.text}`)
        .join(' | ');
      sections.push(`  [${group}] ${item.name} — ${vals}`);
    }
  }

  // Layer 3: AK's tasks
  const tasks = await getAKTasks();
  if (tasks?.data?.boards?.[0]?.items_page?.items) {
    const items = tasks.data.boards[0].items_page.items;
    sections.push('# AK TASK LIST (Monday.com)');
    for (const item of items.slice(0, 15)) {
      const group = item.group?.title || 'Unsorted';
      sections.push(`  [${group}] ${item.name}`);
    }
  }

  // Layer 4: Pepe WhatsApp digest (last 24 hours)
  const digest = await fetchPepeDigest(24);
  if (digest?.messages && digest.messages.length > 0) {
    sections.push('# WHATSAPP DIGEST (Last 24h via Pepe)');
    for (const msg of digest.messages.slice(0, 30)) {
      sections.push(`  ${msg.timestamp} [${msg.from}]: ${msg.text.slice(0, 200)}`);
    }
  } else {
    sections.push('# WHATSAPP: No recent digest from Pepe. Check Pepe status on Optimus.');
  }

  return sections.join('\n\n');
}

/**
 * Build context for the Barrel Program Manager.
 * Layer: Barrel inventory from Monday.com + reference data
 */
export async function buildBarrelContext(): Promise<string> {
  const sections: string[] = [];

  const barrels = await getBarrelInventory();
  if (barrels?.data?.boards?.[0]?.items_page?.items) {
    const items = barrels.data.boards[0].items_page.items;
    sections.push(`# BARREL INVENTORY (${items.length} barrels from Monday.com)`);
    for (const item of items) {
      const vals = item.column_values
        .filter(cv => cv.text)
        .map(cv => `${cv.column?.title || cv.id}: ${cv.text}`)
        .join(' | ');
      sections.push(`  Estiba ${item.name} [${item.group?.title || '?'}] — ${vals}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Build context for the Freight & Logistics agent.
 * Layers: AK email (shipment threads) + operational state (active shipments)
 */
export async function buildFreightContext(): Promise<string> {
  const sections: string[] = [];

  // Active shipments from operational state
  const opsRef = resolve(SWARM_ROOT, 'data/mexico-ops/operational-state.md');
  if (existsSync(opsRef)) {
    const content = readFileSync(opsRef, 'utf-8');
    // Extract just the shipments section
    const shipmentMatch = content.match(/## Active Shipments[\s\S]*?(?=\n## |$)/);
    if (shipmentMatch) {
      sections.push('# ACTIVE SHIPMENTS');
      sections.push(shipmentMatch[0]);
    }
  }

  // Recent freight emails from AK
  const freightQueries = [
    'from:albatrans OR from:igl OR from:priority1 subject:shipment',
    'subject:pickup OR subject:customs OR subject:embarque',
  ];

  for (const q of freightQueries) {
    const emails = await searchAKEmail(q, 3);
    if (emails.length > 0) {
      sections.push('# RECENT FREIGHT EMAILS');
      for (const email of emails) {
        const subj = email.payload?.headers?.find(h => h.name === 'Subject')?.value || '(no subject)';
        const from = email.payload?.headers?.find(h => h.name === 'From')?.value || '(unknown)';
        const date = email.payload?.headers?.find(h => h.name === 'Date')?.value || '';
        sections.push(`  ${date} | From: ${from} | Subject: ${subj}`);
        if (email.snippet) sections.push(`    Preview: ${email.snippet.slice(0, 200)}`);
      }
    }
  }

  return sections.join('\n\n');
}

/**
 * Build context for the Director — cross-agent summary.
 */
export async function buildDirectorContext(): Promise<string> {
  const sections: string[] = [];

  // Full operational state
  const opsRef = resolve(SWARM_ROOT, 'data/mexico-ops/operational-state.md');
  if (existsSync(opsRef)) {
    sections.push(readFileSync(opsRef, 'utf-8'));
  }

  // Vendor map
  const vendorRef = resolve(SWARM_ROOT, 'data/mexico-ops/vendor-map.md');
  if (existsSync(vendorRef)) {
    const content = readFileSync(vendorRef, 'utf-8');
    sections.push(content.slice(0, 3000));
  }

  // Live FX
  const fx = await getFXRate();
  if (fx) {
    sections.push(`\n# LIVE FX: USD/MXN = ${fx.toFixed(4)}`);
  }

  return sections.join('\n\n---\n\n');
}

// ============================================================================
// AGENT CONTEXT ROUTER
// ============================================================================

/**
 * Build the right context for any Mexico Ops agent.
 * Called by the orchestrator when a task routes to this department.
 */
export async function buildMexicoOpsAgentContext(agentId: string): Promise<string> {
  switch (agentId) {
    case 'mexico_ops_director':
      return buildDirectorContext();
    case 'mexico_cogs_analyst':
      return buildCOGSContext();
    case 'mexico_production_tracker':
      return buildProductionContext();
    case 'mexico_barrel_program':
      return buildBarrelContext();
    case 'mexico_freight_logistics':
      return buildFreightContext();
    default:
      // Other agents get the operational state reference
      const opsRef = resolve(SWARM_ROOT, 'data/mexico-ops/operational-state.md');
      if (existsSync(opsRef)) {
        return readFileSync(opsRef, 'utf-8');
      }
      return '';
  }
}
