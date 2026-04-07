/**
 * Mexico Ops Weekly Rhythm — Automated operational cadence.
 *
 * Implements the weekly rhythm from the blueprint:
 * - Monday AM: Compile blockers + wins for all-hands (11 AM EST)
 * - Tuesday: Follow up supplier quotes, confirm bottling calendar
 * - Thursday: Label/artwork status, lead-time risk flags
 * - Friday: Weekly report card, distillery debrief
 * - Monthly: Monica's COGS pipeline (days 3-5, 12-18, 18-22)
 *
 * Also includes:
 * - Compliance calendar (CRT, TTB, trademark deadlines)
 * - Bottling go/no-go checklist
 * - Escalation matrix
 */

import {
  fetchOverdueBills,
  getFXRate,
  getProductionOrders,
  getAKTasks,
  getBarrelInventory,
  searchAKEmail,
  fetchRecentBills,
} from './mexico-ops-data-bridge.js';

// ============================================================================
// COMPLIANCE CALENDAR
// ============================================================================

export interface ComplianceDeadline {
  id: string;
  description: string;
  dueDate: string;        // ISO date
  owner: string;          // AK, Monica, Alex
  category: 'crt' | 'ttb' | 'trademark' | 'lcbo' | 'tax' | 'custom';
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
  automatable: boolean;   // Can the agent prep this?
  notes?: string;
}

/**
 * Known compliance deadlines. In production, these would be
 * stored in SQLite and updated by the CRT/Compliance agent.
 * For now, hardcoded from the intelligence we mined.
 */
export function getComplianceDeadlines(): ComplianceDeadline[] {
  const now = new Date();

  const deadlines: ComplianceDeadline[] = [
    {
      id: 'trademark-s8s9',
      description: 'SIEMPRE trademark §8/§9 filing deadline',
      dueDate: '2026-06-14',
      owner: 'Monica',
      category: 'trademark',
      status: 'upcoming',
      automatable: false,
      notes: 'Non-negotiable. Miss this = lose the mark.',
    },
    {
      id: 'crt-p115775',
      description: 'CRT certificate for US shipment P115775',
      dueDate: '2026-04-10',
      owner: 'AK',
      category: 'crt',
      status: 'due_soon',
      automatable: true,
      notes: 'Agent preps data, human submits to CRT extranet. Vessel cutoff Apr 10.',
    },
    {
      id: 'lcbo-po-ack',
      description: 'LCBO PO acknowledgements (4 POs)',
      dueDate: '2026-04-07',
      owner: 'Monica/AK',
      category: 'lcbo',
      status: 'overdue',
      automatable: false,
      notes: 'POs 781473, 785447, 791355, 794279. LCBO fees if not acknowledged.',
    },
    {
      id: 'gomsa-payment',
      description: 'Gomsa Logística overdue payment — credit line at risk',
      dueDate: '2026-04-22',
      owner: 'Monica',
      category: 'custom',
      status: 'due_soon',
      automatable: false,
      notes: 'US$4,411.69 overdue since Aug 2025. 10 business days.',
    },
  ];

  // Update status based on current date
  for (const d of deadlines) {
    if (d.status === 'completed') continue;
    const due = new Date(d.dueDate);
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) d.status = 'overdue';
    else if (daysUntil <= 7) d.status = 'due_soon';
    else d.status = 'upcoming';
  }

  return deadlines;
}

// ============================================================================
// BOTTLING GO/NO-GO CHECKLIST
// ============================================================================

export interface GoNoGoItem {
  component: string;
  required: boolean;
  status: 'ready' | 'pending' | 'missing' | 'unknown';
  source: string;        // Where to check
  notes?: string;
}

/**
 * Generate a bottling go/no-go checklist for a given SKU.
 * The Packaging Coordinator uses this before every run.
 */
export function buildGoNoGoChecklist(sku: string): GoNoGoItem[] {
  return [
    {
      component: 'Bottles',
      required: true,
      status: 'unknown',
      source: 'Monday.com Inventory board / VIDRIOFORMAS or F&F',
      notes: sku === 'chisme' ? 'VIDRIOFORMAS 8.35 MXN/btl' : 'F&F Conical Clear $1.04/btl',
    },
    {
      component: 'Labels (Front)',
      required: true,
      status: 'unknown',
      source: 'Monday.com Inventory Orders / Motiprint or Custom Label',
    },
    {
      component: 'Labels (Back/Barcode)',
      required: true,
      status: 'unknown',
      source: 'Monday.com Inventory Orders',
    },
    {
      component: 'Labels (Tamper)',
      required: true,
      status: 'unknown',
      source: 'Monday.com Inventory Orders',
    },
    {
      component: 'Caps/Closures',
      required: true,
      status: 'unknown',
      source: 'Monday.com Inventory board',
      notes: sku === 'chisme' ? 'Tegsa screwcap' : 'Amorim natural cork',
    },
    {
      component: 'Master Boxes',
      required: true,
      status: sku === 'plata' ? 'missing' : 'unknown',
      source: 'Monday.com Inventory board / EIDEC',
      notes: sku === 'plata' ? 'CRITICAL: Plata boxes at -2,120. Must order before run.' : undefined,
    },
    {
      component: 'Charms/Neck Tags',
      required: sku !== 'chisme',
      status: 'unknown',
      source: 'Monday.com Inventory board',
    },
    {
      component: 'CRT Dictamen',
      required: true,
      status: 'unknown',
      source: 'AK email / CRT extranet',
      notes: 'Agent preps, human submits. Check with CRT/Compliance agent.',
    },
    {
      component: 'TTB COLA (if US-bound)',
      required: true,
      status: 'unknown',
      source: 'Monica / Prestige Compliance (Tana Shingler)',
    },
    {
      component: 'Juice Available',
      required: true,
      status: 'unknown',
      source: 'Production Tracker / Angie at 1414',
    },
    {
      component: 'Bottling Date Confirmed',
      required: true,
      status: 'unknown',
      source: 'AK calendar / Angie or Sandra (HLC)',
    },
    {
      component: 'Forklift Booked',
      required: true,
      status: 'unknown',
      source: 'AK / Montasa',
      notes: '$1,900 MXN/hr, 2-hr min. Full day $4,860+IVA.',
    },
  ];
}

// ============================================================================
// ESCALATION MATRIX
// ============================================================================

export interface EscalationRule {
  blocker: string;
  firstContact: string;
  escalation: string;
  sla: string;
}

export const ESCALATION_MATRIX: EscalationRule[] = [
  { blocker: 'Distillery not responding', firstContact: 'Angie at 1414', escalation: 'Cesar at Viva Mexico → Alex', sla: '72 hours' },
  { blocker: 'Label/artwork change needed', firstContact: 'Monica via email + WhatsApp', escalation: '—', sla: 'Same day' },
  { blocker: 'TTB/CRT rejection', firstContact: 'Document + email Monica', escalation: 'Alex if business impact', sla: 'Same day' },
  { blocker: 'Freight/customs hold', firstContact: 'Robert Connacher (Priority1)', escalation: 'Monica + Alex', sla: 'Same day if shipment at risk' },
  { blocker: 'BC/LCBO hold not releasing', firstContact: 'Email warehouse → Monica', escalation: 'Lauren Paxton (BevCo)', sla: '48 hours max' },
  { blocker: 'Supplier invoice dispute', firstContact: 'Email supplier w/ timeline demand', escalation: 'Monica for approvals', sla: '5 business days' },
  { blocker: 'Margin below 30%', firstContact: 'COGS Analyst flags Director', escalation: 'Alex immediately', sla: 'Same day' },
  { blocker: 'Production run delayed > 5 days', firstContact: 'Production Tracker flags Director', escalation: 'Alex + Monica', sla: '24 hours' },
  { blocker: 'Viva Mexico overdue > $100K', firstContact: 'Monica + Alex review', escalation: 'Payment plan or supply risk mitigation', sla: 'Immediate review' },
];

// ============================================================================
// WEEKLY BRIEFING GENERATORS
// ============================================================================

/**
 * Build Monday morning all-hands prep.
 * 3 blockers + 3 wins format for the 11 AM EST meeting.
 */
export async function buildMondayBriefing(): Promise<string> {
  const sections: string[] = ['# MONDAY ALL-HANDS PREP — Mexico Operations\n'];

  // Compliance deadlines
  const deadlines = getComplianceDeadlines();
  const urgent = deadlines.filter(d => d.status === 'overdue' || d.status === 'due_soon');
  if (urgent.length > 0) {
    sections.push('## BLOCKERS');
    for (const d of urgent) {
      sections.push(`- [${d.status.toUpperCase()}] ${d.description} (owner: ${d.owner}, due: ${d.dueDate})`);
    }
  }

  // Overdue vendor bills
  const overdue = await fetchOverdueBills();
  const bigOverdue = overdue.filter(b => b.balance > 1000);
  if (bigOverdue.length > 0) {
    sections.push('\n## VENDOR PAYMENT ALERTS');
    for (const b of bigOverdue.slice(0, 5)) {
      sections.push(`- ${b.vendor_name}: ${b.currency_code} ${b.balance.toFixed(2)} overdue (bill ${b.bill_number})`);
    }
  }

  // AK's task list
  const tasks = await getAKTasks();
  if (tasks?.data?.boards?.[0]?.items_page?.items) {
    const items = tasks.data.boards[0].items_page.items;
    const thisWeek = items.filter(i => i.group?.title?.toLowerCase().includes('this week'));
    if (thisWeek.length > 0) {
      sections.push('\n## AK — THIS WEEK');
      for (const item of thisWeek) {
        sections.push(`- ${item.name}`);
      }
    }
  }

  // FX rate
  const fx = await getFXRate();
  if (fx) {
    sections.push(`\n## FX RATE: USD/MXN = ${fx.toFixed(4)}`);
  }

  return sections.join('\n');
}

/**
 * Build Thursday lead-time risk report.
 * Per AK's weekly rhythm — flag anything that could delay next week's production.
 */
export async function buildThursdayRiskReport(): Promise<string> {
  const sections: string[] = ['# THURSDAY LEAD-TIME RISK REPORT\n'];

  // Check pending supplier emails
  const quoteEmails = await searchAKEmail('subject:cotización OR subject:quote has:attachment', 5);
  if (quoteEmails.length > 0) {
    sections.push('## PENDING SUPPLIER QUOTES');
    for (const e of quoteEmails) {
      const subj = e.payload?.headers?.find(h => h.name === 'Subject')?.value || '(no subject)';
      const from = e.payload?.headers?.find(h => h.name === 'From')?.value || 'unknown';
      sections.push(`- ${from}: ${subj}`);
    }
  }

  // Go/no-go for upcoming runs
  for (const sku of ['plata', 'chisme', 'reposado']) {
    const checklist = buildGoNoGoChecklist(sku);
    const issues = checklist.filter(c => c.status === 'missing');
    if (issues.length > 0) {
      sections.push(`\n## GO/NO-GO: ${sku.toUpperCase()}`);
      for (const item of issues) {
        sections.push(`- MISSING: ${item.component} — ${item.notes || 'Check ' + item.source}`);
      }
    }
  }

  // Barrel aging alerts
  const barrels = await getBarrelInventory();
  if (barrels?.data?.boards?.[0]?.items_page?.items) {
    const items = barrels.data.boards[0].items_page.items;
    sections.push(`\n## BARREL AGING STATUS: ${items.length} items tracked`);
  }

  // Compliance deadlines due within 14 days
  const deadlines = getComplianceDeadlines();
  const soon = deadlines.filter(d => d.status !== 'completed' && d.status !== 'upcoming');
  if (soon.length > 0) {
    sections.push('\n## COMPLIANCE DEADLINES (≤14 days)');
    for (const d of soon) {
      sections.push(`- [${d.status}] ${d.description} — due ${d.dueDate} (${d.owner})`);
    }
  }

  return sections.join('\n');
}

/**
 * Build Friday weekly report card.
 */
export async function buildFridayReportCard(): Promise<string> {
  const sections: string[] = ['# FRIDAY REPORT CARD — Mexico Operations\n'];

  // Recent bills (spending this week)
  const bills = await fetchRecentBills({ limit: 10 });
  if (bills.length > 0) {
    let usdTotal = 0;
    let mxnTotal = 0;
    let cadTotal = 0;
    for (const b of bills) {
      if (b.currency_code === 'USD') usdTotal += b.total;
      else if (b.currency_code === 'MXN') mxnTotal += b.total;
      else if (b.currency_code === 'CAD') cadTotal += b.total;
    }
    sections.push('## SPENDING THIS PERIOD');
    if (usdTotal > 0) sections.push(`- USD: $${usdTotal.toFixed(2)}`);
    if (mxnTotal > 0) sections.push(`- MXN: $${mxnTotal.toFixed(2)}`);
    if (cadTotal > 0) sections.push(`- CAD: $${cadTotal.toFixed(2)}`);
  }

  // Production orders status
  const orders = await getProductionOrders();
  if (orders?.data?.boards?.[0]?.items_page?.items) {
    const items = orders.data.boards[0].items_page.items;
    const byGroup: Record<string, number> = {};
    for (const item of items) {
      const g = item.group?.title || 'Unknown';
      byGroup[g] = (byGroup[g] || 0) + 1;
    }
    sections.push('\n## PRODUCTION PIPELINE');
    for (const [stage, count] of Object.entries(byGroup)) {
      sections.push(`- ${stage}: ${count} orders`);
    }
  }

  // Escalation matrix reminder
  sections.push('\n## ESCALATION REFERENCE');
  for (const rule of ESCALATION_MATRIX.slice(0, 4)) {
    sections.push(`- ${rule.blocker} → ${rule.firstContact} (SLA: ${rule.sla})`);
  }

  return sections.join('\n');
}
