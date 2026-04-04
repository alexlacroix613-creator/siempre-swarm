/**
 * Product Teams — Dedicated squads for each tech venture.
 *
 * These are NOT Siempre departments. They're development squads
 * for Alex's product portfolio. Each product gets:
 *   - Product Lead (Sonnet/Stratum III) — roadmap, priorities, user stories
 *   - Dev agents (Free/Stratum I) — frontend, backend, implementation
 *   - QA (Free/Stratum I) — testing
 *
 * Shared services (Design Swarm, DevOps) serve all products.
 * Research department provides context-isolated tech research.
 *
 * Each product has its own memory namespace and git repo.
 * Context isolation is enforced — Combobulator context doesn't
 * leak into FieldKit work.
 */

import type { AgentRole } from './types.js';

export interface ProductTeam {
  id: string;
  name: string;
  description: string;
  containerTag: string;
  repoPath: string;
  productionUrl: string;
  deployPlatform: string;
  lead: AgentRole;
  agents: AgentRole[];
  stack: string[];
  currentPhase: string;
  routingKeywords: string[];
}

// ============================================================================
// COMBOBULATOR — Investor Reporting SaaS
// ============================================================================

const combobulatorTeam: ProductTeam = {
  id: 'combobulator',
  name: 'Combobulator',
  description: 'Investor reporting SaaS at combobulator.tech. The raise is active — this is a sales tool for investor conversations.',
  containerTag: 'project_combobulator',
  repoPath: '~/CLAUDE BRAIN/Combobulator',
  productionUrl: 'https://combobulator.tech',
  deployPlatform: 'Netlify',
  stack: ['React', 'Vite', 'Tailwind', 'Netlify Functions', 'i18n'],
  currentPhase: 'Polish + Monetization (Stripe, analytics, landing copy)',
  lead: {
    id: 'combobulator_lead',
    name: 'Combobulator Product Lead',
    department: 'product' as any,
    containerTag: 'project_combobulator',
    description: 'Owns the Combobulator roadmap. Prioritizes features based on investor feedback and demo effectiveness.',
    capabilities: ['product_management', 'user_stories', 'roadmap', 'demo_flow'],
    modelTier: 'mid', // Sonnet — Stratum III
    systemPrompt: `You are the Product Lead for Combobulator (combobulator.tech), an investor reporting SaaS. The raise is ACTIVE — every improvement here directly supports closing investors.

Current state: React+Vite SPA on Netlify. Demo: Lone Peak Distillers (fictional bourbon). Features: Intelligence Feed, 3 report formats, Bob AI copilot, i18n (EN/ES/FR), cap table, P&L, balance sheet. Pricing: $99/$249.

Known issues: Analytics not connected, no Stripe checkout (mailto only), landing copy could be stronger.

Your job: prioritize features by impact on investor conversations. Everything else is secondary. When Alex asks for Combobulator work, break it into clear tasks for the dev agents.`,
  },
  agents: [
    {
      id: 'combobulator_frontend',
      name: 'Combobulator Frontend Dev',
      department: 'product' as any,
      containerTag: 'project_combobulator',
      description: 'React/Vite/Tailwind frontend development for Combobulator.',
      capabilities: ['react', 'vite', 'tailwind', 'frontend', 'ui_components'],
      modelTier: 'free', // Stratum I — executes within clear specs
      systemPrompt: `You build frontend features for Combobulator (combobulator.tech). React + Vite + Tailwind. Follow the existing component patterns. The Product Lead gives you specs — implement them cleanly.`,
    },
    {
      id: 'combobulator_backend',
      name: 'Combobulator Backend Dev',
      department: 'product' as any,
      containerTag: 'project_combobulator',
      description: 'Netlify Functions backend development for Combobulator.',
      capabilities: ['netlify_functions', 'api', 'serverless', 'chat_api'],
      modelTier: 'free',
      systemPrompt: `You build backend features for Combobulator. Netlify Functions (serverless). Current functions: chat, report-api, feed-sync, analytics, Maton integration. Follow existing patterns.`,
    },
    {
      id: 'combobulator_qa',
      name: 'Combobulator QA',
      department: 'product' as any,
      containerTag: 'project_combobulator',
      description: 'Testing and quality assurance for Combobulator.',
      capabilities: ['testing', 'edge_cases', 'demo_flow_testing', 'cross_browser'],
      modelTier: 'free',
      systemPrompt: `You test Combobulator features. Focus on: demo flow (this is what investors see), cross-browser compatibility, i18n correctness, and edge cases in report generation. The demo MUST work flawlessly.`,
    },
  ],
  routingKeywords: ['combobulator', 'investor report', 'lone peak', 'bob ai', 'raise', 'investor'],
};

// ============================================================================
// FIELDKIT — White-label AI Sales Tool
// ============================================================================

const fieldkitTeam: ProductTeam = {
  id: 'fieldkit',
  name: 'FieldKit',
  description: 'White-label AI sales tool for spirits brands. Multi-tenant SaaS. Siempre is client #1. Revenue model: $49-$299/mo per brand.',
  containerTag: 'project_fieldkit',
  repoPath: '~/fieldkit',
  productionUrl: 'https://fieldkit-ai.netlify.app',
  deployPlatform: 'Netlify + Supabase',
  stack: ['React', 'Vite', 'Tailwind', 'Netlify Functions', 'Supabase', 'OpenRouter'],
  currentPhase: 'Phase 4: Monetization (Stripe, marketing site, onboarding)',
  lead: {
    id: 'fieldkit_lead',
    name: 'FieldKit Product Lead',
    department: 'product' as any,
    containerTag: 'project_fieldkit',
    description: 'Owns FieldKit roadmap. Phases 1-3 complete. Phase 4 is monetization.',
    capabilities: ['product_management', 'multi_tenant', 'monetization', 'onboarding'],
    modelTier: 'mid', // Sonnet — Stratum III
    systemPrompt: `You are the Product Lead for FieldKit (fieldkit-ai.netlify.app), a white-label AI sales tool for spirits brands.

Stack: React+Vite+Tailwind, Netlify Functions, Supabase (Postgres+Auth+Storage+RLS), OpenRouter.
Siempre is client #1. Revenue: $49-$299/mo per brand.

Phases 1-3 COMPLETE: Platform foundation, asset generation (shelf talkers, sell sheets, email drafts), admin dashboard (magic link auth, 5-tab CRUD).
Phase 4 NEXT: Stripe integration, marketing site, onboarding flow.
Phase 5 FUTURE: Multi-brand accounts, audio mode, CRM integration.

Key patterns: system prompts assembled dynamically per-tenant from DB content. OpenRouter wrapper with free-tier fallback chain.`,
  },
  agents: [
    {
      id: 'fieldkit_frontend',
      name: 'FieldKit Frontend Dev',
      department: 'product' as any,
      containerTag: 'project_fieldkit',
      description: 'React/Vite/Tailwind frontend for FieldKit multi-tenant platform.',
      capabilities: ['react', 'vite', 'tailwind', 'multi_tenant_ui', 'css_variables'],
      modelTier: 'free',
      systemPrompt: `You build frontend features for FieldKit. React + Vite + Tailwind. Multi-tenant via CSS variables per brand. Follow existing patterns. Dark theme admin UI.`,
    },
    {
      id: 'fieldkit_backend',
      name: 'FieldKit Backend Dev',
      department: 'product' as any,
      containerTag: 'project_fieldkit',
      description: 'Supabase + Netlify Functions backend for FieldKit.',
      capabilities: ['supabase', 'postgres', 'rls', 'netlify_functions', 'openrouter'],
      modelTier: 'free',
      systemPrompt: `You build backend features for FieldKit. Supabase (Postgres + Auth + Storage + RLS) + Netlify Functions. All queries scoped by brand_id via RLS. OpenRouter for LLM calls with free-tier fallback chain.`,
    },
    {
      id: 'fieldkit_qa',
      name: 'FieldKit QA',
      department: 'product' as any,
      containerTag: 'project_fieldkit',
      description: 'Testing for FieldKit including multi-tenant isolation.',
      capabilities: ['testing', 'multi_tenant_testing', 'rls_verification', 'asset_generation_testing'],
      modelTier: 'free',
      systemPrompt: `You test FieldKit features. Critical: verify multi-tenant isolation (brand A cannot see brand B data). Test RLS policies. Test asset generation (shelf talkers, sell sheets, emails). Test auth flows.`,
    },
  ],
  routingKeywords: ['fieldkit', 'field kit', 'shelf talker', 'sell sheet', 'multi-tenant', 'brand onboarding'],
};

// ============================================================================
// GAWD — Persistent AI World
// ============================================================================

const gawdTeam: ProductTeam = {
  id: 'gawd',
  name: 'GAWD',
  description: 'Persistent AI world at gawd.app. Three codebases. Creative/experimental project.',
  containerTag: 'project_gawd',
  repoPath: '~/CLAUDE BRAIN/GAWD',
  productionUrl: 'https://gawd.app',
  deployPlatform: 'Vercel',
  stack: ['Multiple codebases', 'Vercel', 'invite-code auth'],
  currentPhase: 'Active development',
  lead: {
    id: 'gawd_lead',
    name: 'GAWD Product Lead',
    department: 'product' as any,
    containerTag: 'project_gawd',
    description: 'Owns GAWD vision and development. Three codebases, Vercel deploy.',
    capabilities: ['product_vision', 'world_design', 'creative_direction'],
    modelTier: 'mid', // Sonnet — Stratum III
    systemPrompt: `You are the Product Lead for GAWD (gawd.app), a persistent AI world. This is a creative/experimental project. Three codebases deployed on Vercel with invite-code authentication. Your job is to maintain the creative vision while keeping the technical implementation clean.`,
  },
  agents: [
    {
      id: 'gawd_dev',
      name: 'GAWD Developer',
      department: 'product' as any,
      containerTag: 'project_gawd',
      description: 'Full-stack development across GAWD\'s three codebases.',
      capabilities: ['fullstack', 'vercel', 'world_building', 'auth'],
      modelTier: 'free',
      systemPrompt: `You develop features for GAWD (gawd.app). Three codebases, Vercel deployment, invite-code auth. Follow existing patterns in each codebase.`,
    },
  ],
  routingKeywords: ['gawd', 'g.a.w.d', 'persistent world', 'ai world'],
};

// ============================================================================
// REVIEWSHIELD — Review Reply SaaS
// ============================================================================

const reviewshieldTeam: ProductTeam = {
  id: 'reviewshield',
  name: 'ReviewShield',
  description: 'Review reply SaaS. Chrome extension + API running on Mac mini (Optimus).',
  containerTag: 'project_reviewshield',
  repoPath: '~/CLAUDE BRAIN/ReviewShield',
  productionUrl: 'https://reviewshield-landing.netlify.app',
  deployPlatform: 'Netlify (landing) + Mac mini (API)',
  stack: ['Chrome extension', 'Flask/FastAPI', 'OpenRouter (Gemini Flash)', 'Tailscale'],
  currentPhase: 'Live — API on Optimus, Chrome extension built',
  lead: {
    id: 'reviewshield_lead',
    name: 'ReviewShield Product Lead',
    department: 'product' as any,
    containerTag: 'project_reviewshield',
    description: 'Owns ReviewShield product. API runs on Mac mini, Chrome extension for review replies.',
    capabilities: ['product_management', 'chrome_extension', 'api_management'],
    modelTier: 'mid', // Sonnet — Stratum III
    systemPrompt: `You are the Product Lead for ReviewShield, a review reply SaaS. Chrome extension lets businesses reply to reviews with AI-generated responses. API runs on Mac mini (Optimus) at 100.103.182.114:8000 via Tailscale. Uses Gemini 2.5 Flash via OpenRouter. Landing page at reviewshield-landing.netlify.app.`,
  },
  agents: [
    {
      id: 'reviewshield_dev',
      name: 'ReviewShield Developer',
      department: 'product' as any,
      containerTag: 'project_reviewshield',
      description: 'Chrome extension + API development for ReviewShield.',
      capabilities: ['chrome_extension', 'python_api', 'openrouter', 'tailscale'],
      modelTier: 'free',
      systemPrompt: `You develop ReviewShield features. Chrome extension (JS) + Python API on Mac mini. The API uses OpenRouter (Gemini Flash) for generating review replies. Accessible via Tailscale.`,
    },
  ],
  routingKeywords: ['reviewshield', 'review shield', 'review reply', 'chrome extension', 'review management'],
};

// ============================================================================
// REGISTRY
// ============================================================================

export const PRODUCT_TEAMS: Record<string, ProductTeam> = {
  combobulator: combobulatorTeam,
  fieldkit: fieldkitTeam,
  gawd: gawdTeam,
  reviewshield: reviewshieldTeam,
};

/**
 * Route a prompt to the right product team based on keywords.
 */
export function routeToProduct(prompt: string): string | null {
  const lower = prompt.toLowerCase();

  for (const [id, team] of Object.entries(PRODUCT_TEAMS)) {
    for (const keyword of team.routingKeywords) {
      if (lower.includes(keyword)) return id;
    }
  }

  return null;
}

/**
 * Get total agent count across all product teams.
 */
export function getProductTeamStats(): { teams: number; leads: number; devs: number; total: number } {
  let leads = 0, devs = 0;
  for (const team of Object.values(PRODUCT_TEAMS)) {
    leads++;
    devs += team.agents.length;
  }
  return { teams: Object.keys(PRODUCT_TEAMS).length, leads, devs, total: leads + devs };
}
