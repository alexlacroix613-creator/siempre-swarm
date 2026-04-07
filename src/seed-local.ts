#!/usr/bin/env node
/**
 * Seed local memory with the same baseline knowledge we put in supermemory.
 * Zero cost, unlimited, works offline.
 */

import { LocalMemoryStore } from './memory/local-memory.js';

const store = new LocalMemoryStore();

const entries = [
  // Shared context
  { namespace: 'shared_siempre', content: 'Siempre Spirits is a premium craft tequila company founded by Alex Lacroix (CEO). Produces Blanco, Reposado, Añejo, Cristalino, and Plata. Accessible premium positioning. Lean team (~7 people), $30MM revenue goal.', importance: 1.0 },
  { namespace: 'shared_siempre', content: 'Communication style: Alex is direct, warm, business-savvy. Distributors get numbers-forward partnership language, partners/legal get precise protective language, media/public get aspirational brand voice. NEVER send external communications without Alex\'s explicit permission.', importance: 1.0 },
  { namespace: 'shared_siempre', content: 'Operating posture: Proactive partner, not passive assistant. Analyze, judge, persist, act. If broken, fix it. If stale, pull it forward. If blocked, move to next productive thing. Filter through: "Does this serve the $30MM goal with 7 people?"', importance: 1.0 },

  // User Alex
  { namespace: 'user_alex', content: 'Alex is CEO/Founder of Siempre Spirits. Wears every hat. Technical (builds tools, understands code) but primarily a business operator. Values speed and shipping. Hits Claude usage caps frequently — needs token-efficient workflows.', importance: 0.9 },
  { namespace: 'user_alex', content: 'Active projects: (1) Siempre Spirits — tequila sales/distribution. (2) Combobulator — investor reporting SaaS at combobulator.tech. (3) FieldKit — white-label AI sales tool. (4) ReviewShield — review reply SaaS. (5) Billy — creative pipeline. (6) Siempre Swarm — this multi-agent system.', importance: 0.9 },

  // DevOps
  { namespace: 'dept_devops', content: 'Deployment map: SiempreCommand localhost:5050, Billy localhost:5055, Incentive Planner siempre-incentive-planner.netlify.app, ReviewShield Landing reviewshield-landing.netlify.app, ReviewShield API Mac mini 100.103.182.114:8000, Combobulator combobulator.tech, FieldKit fieldkit-ai.netlify.app. Optimus (Mac mini M4) always on via ssh optimus.', importance: 1.0 },
  { namespace: 'dept_devops', content: 'Tech stack: React+Vite+Tailwind frontends. Netlify Functions (serverless Express) APIs. Supabase (Postgres+Auth+Storage+RLS). OpenRouter for LLM with free-tier fallbacks. Flask for local tools. GitHub repos under alexlacroix613-creator.', importance: 0.8 },

  // Creative
  { namespace: 'dept_design', content: 'Billy creative pipeline at localhost:5055. Pipeline: Brief → Parse → 3 Directions → 3 Images → Select → Art Direct → Copy → Done. Flask + OpenRouter (Gemini Flash primary) + SQLite. Repo: billy-creative.', importance: 0.8 },
  { namespace: 'dept_design', content: 'Siempre brand: Premium craft tequila, accessible price point. Visual identity: authenticity, Mexican heritage, modern craft. Brand voice: confident, warm, never pretentious. Key: quality ingredients, traditional methods, founder story.', importance: 1.0 },
  { namespace: 'dept_design', content: 'VIDEO CAPABILITY: Remotion skill available — React-based programmatic video. 38 rule files: animations, 3D, charts, captions, voiceover (ElevenLabs), transitions, FFmpeg. Video Specialist agent owns production, Digital team provides direction, Tim reviews.', importance: 0.8 },

  // Pricing
  { namespace: 'dept_pricing', content: 'Pricing fundamentals: 3-tier distribution (supplier → distributor → retailer). Key terms: FOB, SRP, depletion allowance, channel pricing. Margin targets competitive against Espolòn, Olmeca Altos, Casamigos.', importance: 1.0 },
  { namespace: 'dept_pricing', content: 'SKUs: Blanco (unaged, citrus/agave), Reposado (4-6mo, oak/vanilla), Añejo (12+mo, premium), Cristalino (filtered añejo, fastest growing), Plata (silver, cocktail market). 750mL primary, some 1L/1.75L.', importance: 0.9 },
  { namespace: 'agent_pricing_va', content: 'Virginia: CONTROL STATE. VA ABC sole wholesaler/retailer. FOB direct to VA ABC, statutory markup ~30-34%, excise $1.85/gal. Channel pricing NOT allowed. Uniform statewide SRP. ABC Pricing Committee approval required. Form 102 registration. 90-day notice for price changes.', importance: 1.0 },
  { namespace: 'agent_pricing_tn', content: 'Tennessee: OPEN STATE. 3-tier with private distributors. Excise $4.40/gal. Channel pricing allowed (on vs off-premise). Key distributors: Republic National, Southern Glazer\'s. Nashville heavily on-premise, Memphis/Knoxville more off-premise. Promotional pricing allowed.', importance: 1.0 },
  { namespace: 'agent_pricing_wa', content: 'Washington: Privatized 2012. 20.5% spirits sales tax + $3.77/liter tax. One of highest US tax burdens. Distributors: Southern Glazer\'s, RNDC. Channel pricing allowed. High tax means FOB must be competitive. Costco major retailer.', importance: 1.0 },

  // Sales Intel
  { namespace: 'dept_sales_intel', content: 'Data sources: VIP iDig (US depletions), Winebow DiverPort (CA/regional), Oklahoma state portal, Canadian provincial portals (LCBO, SAQ, BCLDB), Prestige NWOW (shipments/revenue via email), Zoho Books (invoicing).', importance: 1.0 },

  // Sales Department (National AI Sales Force)
  { namespace: 'dept_sales', content: 'National AI Sales Force: 55 market agents (1 per state/province) + Sales Director. Tier 1 (8): CA, TX, CO, WA, OR, FL, IL, ON. Tier 2 (12): KS, OK, TN, GA, AR, MO, VA, UT, AB, SK, MB, BC. Phase 3 (35): regulatory shells only. Each agent loads foundation.md + market dossier. COMMS FIREWALL: zero external contact authority at every level.', importance: 1.0 },
  { namespace: 'dept_sales', content: 'Weekly scorecard: 11 KPIs (depletions 20%, new PODs 12%, menu wins 10%, displays 10%, price compliance 10%, ride-withs 8%, account calls 8%, chain follow-ups 7%, issues closed 5%, forecast accuracy 5%, trade spend 5%). A markets: 5-factor scoring. B markets: 3-factor. C markets: 1-factor + dark alert.', importance: 0.9 },
  { namespace: 'dept_sales', content: 'COMMS FIREWALL: Market agents → Sales Director → Solace → Alex/Nick/Rick/Monica/Anna. NO agent contacts anyone outside @siempretequila.com. External contact recommendations use format: RECOMMENDED ACTION: [who] [what] [why]. This is permanent until Alex explicitly changes it.', importance: 1.0 },
  { namespace: 'dept_sales', content: 'Market diagnosis principles: (1) Name the distributor, not the state. (2) Lead with the number. (3) Diagnose, dont describe. (4) Use three-tier language. (5) End with a recommendation. Tone: smart VP of Sales emailing the CEO at 7am — direct, specific, actionable.', importance: 0.9 },
  { namespace: 'dept_sales', content: 'Key flags as of April 2026: Georgia -81% YoY (UDIGA execution gap). Tennessee -81% YoY (franchise-flagged, ADC). Missouri transitioning Smart → Vintegrity Apr 9 go-live. Ontario: Analyticsmart access revoked. Oklahoma: iDig incomplete, use Dive/Optimus. 38 of 52 domestic markets declining YoY.', importance: 0.9 },

  // Research
  { namespace: 'dept_research', content: 'CONTEXT ISOLATION RULE: Siempre business research must NEVER bleed into tech/startup research. Each research agent has its own namespace. Cross-pollination only through R&D Director with explicit labeling.', importance: 1.0 },
  { namespace: 'project_combobulator', content: 'Combobulator: investor reporting SaaS at combobulator.tech. React+Vite+Netlify. Demo: Lone Peak Distillers. Features: reports, Bob AI, i18n, cap table, P&L. Pricing: $99/$249. Raise is active.', importance: 0.8 },
  { namespace: 'project_fieldkit', content: 'FieldKit: white-label AI sales tool at fieldkit-ai.netlify.app. React+Vite+Tailwind, Netlify Functions, Supabase. Siempre is client #1. Phases 1-3 complete. Revenue: $49-$299/mo per brand.', importance: 0.8 },

  // Comms
  { namespace: 'dept_comms', content: 'Communication relationships: Distributors (numbers-forward, partnership), Partners/Legal (precise, protective), Media/Public (aspirational, authentic), Investors (data-driven, Combobulator), Internal (direct, action-oriented).', importance: 0.9 },

  // Mexico Operations (Department 7)
  { namespace: 'dept_mexico_ops', content: 'Mexico Operations covers everything between the agave field and the export dock. Key people: Ana-Karen Moreno (ground ops, Arandas/GDL), Monica Sanita (COO, financial/compliance from Canada), Alejandro Sanchez (field hand at 1414). 9 agents: Director, Production Tracker, COGS Analyst, Packaging Coordinator, CRT/Compliance, Freight & Logistics, Warehouse & Inventory, Barrel Program Manager, Distillery Liaison.', importance: 1.0 },
  { namespace: 'dept_mexico_ops', content: 'Distillery partners: NOM 1414 Viva Mexico (Angie/Cesar/Sergio — Plata, Repo, Añejo, Exclusivos, Rebel Cask), NOM 1479 HLC (Sandra/Abraham — Chismé), NOM 1438 DVT (Plata, Repo, Spot Añejo, XA), NOM 1137 La Cofradia (Supremo Tahona, Rebel Cask). Brand separation: Siempre and Chismé NEVER bleed — separate NOMs, separate cost stacks, separate label families.', importance: 1.0 },
  { namespace: 'dept_mexico_ops', content: 'COGS 6-Layer Stack: (1) Distillery+Bottling MXN, (2) Glass MXN/USD, (3) Boxes MXN, (4) Caps MXN/USD, (5) Labels USD/MXN, (6) Freight USD. CRITICAL: always check currency_code on Zoho bills ($ appears on both MXN and USD). Use live FX rate. Freight is per pallet not per case. US has NO Layer 6 (Prestige handles). After each run, pull fresh invoices — never use historical averages.', importance: 1.0 },
  { namespace: 'dept_mexico_ops', content: 'Barrel inventory at NOM 1414: 120 barrels total (34 filled, 76 empty, 7 sold, 3 dumped). 7,438 total liters. CRITICAL: Estibas 5 and 8 (Statik) at 980 and 1,158 days — extremely long-aged, need bottling decision. Active programs: Rebel Cask (Co-op, Conexiones/Doug, Statik, NYNJ), Fuerte Fanatics, 19 single barrel leads (only 3 called). Pricing: RC Repo FOB $210/PTR $315, RC Añejo/SB FOB $325/PTR $449.94.', importance: 0.9 },
  { namespace: 'dept_mexico_ops', content: 'Active shipments (Apr 2026): (1) P115775 Prestige/USA — cargo ready, CRT cert MISSING (vessel cutoff Apr 10), (2) LCBO 781473 Chismé 400 boxes — Albatrans pickup Apr 7, (3) IGL SK Chismé+Siempre — crossing Laredo border, 2nd half-payment due, (4) AB/BC via BevCollective — ETA pending, (5) LCBO 794279 — shipper confusion. Carriers: Albatrans, IGL, Sophia, BevCollective/Alejandra, Priority1/Robert Connacher.', importance: 0.9 },
  { namespace: 'dept_mexico_ops', content: 'Vendor health: Gomsa Logística US$4,411 overdue (credit suspension warning, 10 business days). EIDEC/Hugo outstanding debt (100% prepay on new). 1414 barrel pricing months overdue from Angie. Plata master boxes at NEGATIVE inventory (-2,120). Motiprint healthy (best labels $0.28 USD). HLC functional but won\'t share invoice until bottling starts.', importance: 0.9 },
  { namespace: 'dept_mexico_ops', content: 'Regulatory automation ceiling: CRT CAET — NO API, agent preps data, human submits. TTB COLA — NO API, agent preps docs, human submits. VUCEM — SOAP, partially automatable with FIEL. CFDI 4.0 — fully automatable via FiscalAPI. Zoho, Monday, Gmail, Calendar — fully automatable via Maton gateway. SIEMPRE trademark §8/9 deadline June 14, 2026.', importance: 0.8 },
  { namespace: 'dept_mexico_ops', content: 'Constitutional compliance: Article 2 (Owner Primacy) — Production Tracker=AK, COGS Analyst=Monica, Director=both. Article 3 (Minimal Footprint) — agents only access needed data. Article 5.4 — NO external comms without human approval. Article 8 — security baseline. Pepe owns WhatsApp, Mexico Ops consumes output. Pricing Intelligence owns pricing decisions. Sales Intelligence owns depletion data.', importance: 0.8 },
];

console.log(`Seeding local memory with ${entries.length} entries...`);
const count = store.storeBatch(entries);
console.log(`Stored: ${count} entries`);

// Verify with a search
console.log(`\nTest search: "Virginia pricing compliance"`);
const results = store.search('Virginia pricing compliance', { limit: 3 });
for (const r of results) {
  console.log(`  [${r.score.toFixed(2)}] [${r.namespace}] ${r.content.slice(0, 80)}...`);
}

// Show stats
console.log(`\nNamespace stats:`);
const stats = store.stats();
for (const [ns, s] of Object.entries(stats)) {
  console.log(`  ${ns}: ${s.latestCount} active memories`);
}

store.close();
console.log(`\nDatabase: ~/.siempre-swarm/memory.db`);
