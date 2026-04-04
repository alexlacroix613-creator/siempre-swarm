#!/usr/bin/env node
/**
 * Seed Supermemory — Initialize department namespaces with baseline knowledge.
 *
 * This populates the knowledge graph so agents start with real context
 * instead of generic training data. Run once at setup, then update
 * as projects evolve.
 *
 * Usage:
 *   SUPERMEMORY_API_KEY=xxx npx tsx src/seed-memory.ts
 */

import { SupermemoryClient, DEPARTMENT_TAGS, pricingAgentTag, projectTag } from './memory/supermemory-client.js';

const API_KEY = process.env.SUPERMEMORY_API_KEY;
if (!API_KEY) {
  console.error('Set SUPERMEMORY_API_KEY env var');
  process.exit(1);
}

const client = new SupermemoryClient(API_KEY);

interface SeedEntry {
  containerTag: string;
  content: string;
  metadata?: Record<string, string>;
}

// ============================================================================
// SHARED SIEMPRE CONTEXT — What every agent should know
// ============================================================================

const sharedContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.shared,
    content: `Siempre Spirits is a premium craft tequila company founded by Alex Lacroix (CEO). The brand produces Blanco, Reposado, Añejo, Cristalino, and Plata expressions. Siempre positions as accessible premium — craft quality at a price point that competes with major brands. The company operates with a very lean team (~7 people) with a $30MM revenue goal. Alex wears every hat: CEO, sales, marketing, tech, creative.`,
    metadata: { type: 'company_overview', importance: 'critical' },
  },
  {
    containerTag: DEPARTMENT_TAGS.shared,
    content: `Communication style: Alex is direct, warm, business-savvy. He communicates differently by audience — distributors get numbers-forward partnership language, partners/legal get precise protective language, media/public get aspirational brand voice. All external communications must be approved by Alex before sending. HARD RULE: Never send emails or messages to external parties without explicit permission.`,
    metadata: { type: 'communication_style', importance: 'critical' },
  },
  {
    containerTag: DEPARTMENT_TAGS.shared,
    content: `Operating posture: Be a proactive partner, not a passive assistant. Analyze situations, make judgment calls, persist through blockers, act in the team's best interests. If something is broken, fix it. If work is stale, pull it forward. If blocked, move to the next productive thing. Filter decisions through: "Does this serve the $30MM goal with 7 people?"`,
    metadata: { type: 'operating_principles', importance: 'critical' },
  },
];

// ============================================================================
// USER ALEX — Personal context and preferences
// ============================================================================

const userContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.user,
    content: `Alex is CEO/Founder of Siempre Spirits. He wears every hat — sales, marketing, tech, creative, fundraising. He's technical (builds tools, understands code) but primarily a business operator. He values speed, shipping, and not destroying what's already built. He hits Claude usage caps frequently and needs token-efficient workflows.`,
    metadata: { type: 'user_profile', importance: 'high' },
  },
  {
    containerTag: DEPARTMENT_TAGS.user,
    content: `Alex's active projects: (1) Siempre Spirits — tequila sales, distribution, brand building. (2) Combobulator — investor reporting SaaS at combobulator.tech, raise is active. (3) FieldKit — white-label AI sales tool for spirits brands, multi-tenant SaaS, Siempre is client #1. (4) ReviewShield — review reply SaaS with Chrome extension. (5) Billy — creative direction pipeline tool. (6) Siempre Swarm — multi-agent orchestration system (this project).`,
    metadata: { type: 'active_projects', importance: 'high' },
  },
];

// ============================================================================
// DEVOPS — Deployment map
// ============================================================================

const devopsContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.devops,
    content: `Deployment map (as of 2026-04-04):
- SiempreCommand: localhost:5050 (Flask), local only, 5 views, 3 agents live
- Billy (Creative Engine): localhost:5055 (Flask), local only, full pipeline verified
- Incentive Planner: siempre-incentive-planner.netlify.app (deployed)
- ReviewShield Landing: reviewshield-landing.netlify.app (deployed)
- ReviewShield API: Mac mini Optimus (100.103.182.114:8000) via Tailscale, Gemini 2.5 Flash via OpenRouter
- Combobulator: combobulator.tech (Netlify, Vite build)
- FieldKit: fieldkit-ai.netlify.app (Netlify Functions + Supabase)
- Optimus (Mac mini M4): Always on, reachable via "ssh optimus" on Tailscale. Used for long-running processes, background compute.`,
    metadata: { type: 'deployment_map', importance: 'critical' },
  },
  {
    containerTag: DEPARTMENT_TAGS.devops,
    content: `Tech stack patterns across projects: React+Vite+Tailwind for frontends. Netlify Functions (serverless Express) for APIs. Supabase for database (Postgres+Auth+Storage+RLS). OpenRouter for LLM calls with free-tier fallback chains. Flask for local tools (SiempreCommand, Billy). GitHub repos under alexlacroix613-creator org.`,
    metadata: { type: 'tech_stack', importance: 'high' },
  },
];

// ============================================================================
// CREATIVE — Billy and Thanks Tim context
// ============================================================================

const creativeContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.creative,
    content: `Billy is the creative direction pipeline tool at localhost:5055. Pipeline: Brief → Parse → 3 Directions → 3 Images → Select → Art Direct → Copy → Done. Built with Flask, uses OpenRouter for text (Gemini 2.5 Flash primary, Kimi K2.5, Nemotron free fallback) and OpenRouter for image (Gemini 3 Pro Image). SQLite persistence, projects survive restarts. Repo: github.com/alexlacroix613-creator/billy-creative.`,
    metadata: { type: 'tool_reference', importance: 'high' },
  },
  {
    containerTag: DEPARTMENT_TAGS.creative,
    content: `Siempre brand positioning: Premium craft tequila, accessible price point. Visual identity emphasizes authenticity, Mexican heritage, and modern craft. Packaging is distinctive with clean design. Brand voice is confident, warm, never pretentious. Key selling points: quality ingredients, traditional methods, founder story, competitive pricing vs premium competitors.`,
    metadata: { type: 'brand_guidelines', importance: 'critical' },
  },
];

// ============================================================================
// PRICING — Baseline knowledge
// ============================================================================

const pricingContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.pricing,
    content: `Siempre Spirits pricing fundamentals: We operate in a 3-tier distribution system (supplier → distributor → retailer). Key terms: FOB (price to distributor), SRP (suggested retail price), depletion allowance (promotional discount per case), channel pricing (different prices for on-premise vs off-premise where allowed). Margin targets vary by state but generally aim for competitive SRP against brands like Espolòn, Olmeca Altos, Casamigos at their respective tiers.`,
    metadata: { type: 'pricing_fundamentals', importance: 'critical' },
  },
  {
    containerTag: DEPARTMENT_TAGS.pricing,
    content: `SKU reference — Siempre Tequila expressions: (1) Blanco — unaged, citrus/agave forward, most competitive SKU. (2) Reposado — aged 4-6 months, oak/vanilla notes. (3) Añejo — aged 12+ months, premium tier. (4) Cristalino — filtered añejo, premium clear, fastest growing category. (5) Plata — silver expression for cocktail market. Each expression has 750mL and potentially 1L/1.75L configurations depending on state and channel.`,
    metadata: { type: 'product_reference', importance: 'high' },
  },
  {
    containerTag: pricingAgentTag('VA'),
    content: `Virginia is a CONTROL STATE. VA ABC is the sole wholesaler and retailer for spirits. Suppliers sell FOB directly to VA ABC, which applies statutory markup (~30-34%) and excise tax ($1.85/gallon) to set uniform statewide SRP. Channel pricing is NOT allowed. All pricing requires ABC Pricing Committee approval. Product registration via ABC Form 102 required before pricing submission. Price adjustments need 90-day written notice.`,
    metadata: { type: 'state_compliance', state: 'VA', importance: 'critical' },
  },
  {
    containerTag: pricingAgentTag('TN'),
    content: `Tennessee is an OPEN STATE for spirits distribution. Uses 3-tier system with private distributors. Excise tax: $4.40/gallon for spirits. Allows channel pricing (on-premise vs off-premise can differ). Key distributors in TN include Republic National, Southern Glazer's. Nashville market is heavily on-premise driven (Broadway bars, tourism). Memphis and Knoxville are more off-premise/retail focused. State allows promotional pricing with distributor agreements.`,
    metadata: { type: 'state_compliance', state: 'TN', importance: 'critical' },
  },
  {
    containerTag: pricingAgentTag('WA'),
    content: `Washington privatized spirits sales in 2012 (Initiative 1183). No longer a control state but has unique tax structure. Spirits sales tax: 20.5% at retail + $3.77/liter spirits liter tax. One of the highest total tax burdens in the US for spirits. Distributors include Southern Glazer's, RNDC. Channel pricing allowed. Important: the high tax burden means FOB must be competitive to maintain attractive SRP. Costco is a major spirits retailer in WA.`,
    metadata: { type: 'state_compliance', state: 'WA', importance: 'critical' },
  },
];

// ============================================================================
// SALES INTEL — Data source reference
// ============================================================================

const salesIntelContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.salesIntel,
    content: `Sales data sources for Siempre Spirits: (1) VIP iDig — US depletion data, tracks case sales by market/account/period. Primary source for US sales intelligence. (2) Winebow DiverPort — California and regional distribution data, on/off-premise splits. (3) Oklahoma state portal — OK-specific compliance and sales reporting. (4) Canadian provincial portals — LCBO (Ontario), SAQ (Quebec), BCLDB (BC) for Canadian market data. (5) Prestige NWOW — shipment volumes and revenue breakdowns, arrives via email. (6) Zoho Books — invoicing and accounts receivable.`,
    metadata: { type: 'data_sources', importance: 'critical' },
  },
];

// ============================================================================
// RESEARCH — Context isolation rules
// ============================================================================

const researchContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.research,
    content: `CRITICAL RULE: Research contexts must remain isolated. Siempre Spirits business research (market, competitors, distributors, regulatory) must NEVER bleed into tech/startup research (Combobulator, FieldKit, new ventures) and vice versa. Each research agent has its own containerTag. Cross-pollination only happens through the R&D Director who explicitly labels which context each finding belongs to.`,
    metadata: { type: 'governance_rule', importance: 'critical' },
  },
  {
    containerTag: projectTag('combobulator'),
    content: `Combobulator is an investor reporting SaaS at combobulator.tech. React+Vite SPA on Netlify with Netlify Functions backend. Features: Intelligence Feed triage, quarterly/annual/monthly reports, Bob AI copilot, i18n (EN/ES/FR), shareholder personalization, cap table display, P&L, balance sheet. Demo: Lone Peak Distillers (fictional bourbon company). Pricing: $99 Starter / $249 Growth. The raise is active — Combobulator is a sales tool for investor conversations.`,
    metadata: { type: 'project_context', project: 'combobulator' },
  },
  {
    containerTag: projectTag('fieldkit'),
    content: `FieldKit is a white-label AI sales tool for spirits brands. Multi-tenant SaaS where brands get a branded AI chat page for distributor reps. Features: AI chat, shelf talker generation (Gemini image), PDF sell sheets (PDFKit), email drafts, admin dashboard with magic link auth. Stack: React+Vite+Tailwind, Netlify Functions, Supabase (Postgres+Auth+Storage+RLS), OpenRouter. Live at fieldkit-ai.netlify.app. Siempre is client #1. Revenue model: $49-$299/mo per brand. Phases 1-3 complete, Phase 4 (monetization) next.`,
    metadata: { type: 'project_context', project: 'fieldkit' },
  },
];

// ============================================================================
// COMMS — Relationship context
// ============================================================================

const commsContext: SeedEntry[] = [
  {
    containerTag: DEPARTMENT_TAGS.comms,
    content: `Key communication relationships for Siempre Spirits: (1) Distributors — partnership-focused, numbers-forward. Reference depletions, PODs, velocity. Formal but warm. (2) Partners/Legal — precise, protective of Siempre's interests. Understand contract language. Firm but not adversarial. (3) Media/Public — aspirational, authentic, premium craft positioning. Understand spirits media landscape. (4) Investors — Combobulator is the primary investor communication tool. Data-driven, growth-narrative, transparent. (5) Internal team — direct, action-oriented, no fluff.`,
    metadata: { type: 'relationship_map', importance: 'high' },
  },
];

// ============================================================================
// EXECUTE SEEDING
// ============================================================================

async function seed() {
  const allEntries: SeedEntry[] = [
    ...sharedContext,
    ...userContext,
    ...devopsContext,
    ...creativeContext,
    ...pricingContext,
    ...salesIntelContext,
    ...researchContext,
    ...commsContext,
  ];

  console.log(`\nSeeding Supermemory with ${allEntries.length} baseline entries...\n`);

  let success = 0;
  let failed = 0;

  for (const entry of allEntries) {
    try {
      const result = await client.addMemory({
        content: entry.content,
        containerTag: entry.containerTag,
        metadata: entry.metadata,
      });
      console.log(`  ✓ [${entry.containerTag}] ${entry.content.slice(0, 60)}...`);
      success++;

      // Pace requests (free tier)
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.log(`  ✗ [${entry.containerTag}] ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} stored, ${failed} failed.`);
  console.log(`Remaining rate limit: ${client.getRateLimitRemaining()}`);

  // List unique namespaces seeded
  const tags = new Set(allEntries.map(e => e.containerTag));
  console.log(`\nNamespaces seeded (${tags.size}):`);
  for (const tag of [...tags].sort()) {
    console.log(`  ${tag}`);
  }
}

seed().catch(console.error);
