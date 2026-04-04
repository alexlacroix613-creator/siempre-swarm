/**
 * OpenRouter Bridge — Executes prompts against free/cheap models.
 *
 * This is what subagents call when they don't need Opus-level thinking.
 * OpenAI-compatible API, just different base URL and model strings.
 */

import { routeTask, classifyTask, buildOpenRouterRequest, type TaskCategory, type RouteResult } from './model-router.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface BridgeRequest {
  prompt: string;
  systemPrompt?: string;
  category?: TaskCategory;          // Override auto-classification
  temperature?: number;
  maxTokens?: number;
  forceModel?: string;              // Override routing entirely
}

export interface BridgeResponse {
  content: string;
  model: string;
  tier: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
}

export interface BridgeStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  costByTier: Record<string, number>;
  callsByTier: Record<string, number>;
  savedVsOpus: number;              // Estimated savings vs all-Opus routing
}

// Running session stats
const stats: BridgeStats = {
  totalCalls: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCost: 0,
  costByTier: {},
  callsByTier: {},
  savedVsOpus: 0,
};

// Opus cost for comparison ($ per million tokens)
const OPUS_COST_INPUT = 15.00;
const OPUS_COST_OUTPUT = 75.00;

/**
 * Execute a prompt through OpenRouter with automatic model routing.
 */
export async function execute(
  apiKey: string,
  request: BridgeRequest
): Promise<BridgeResponse> {
  const startTime = Date.now();

  // Route the task
  const category = request.category || classifyTask(request.prompt);
  const route = routeTask(category);

  // Build messages
  const messages: Array<{ role: string; content: string }> = [];
  if (request.systemPrompt) {
    messages.push({ role: 'system', content: request.systemPrompt });
  }
  messages.push({ role: 'user', content: request.prompt });

  // Build request body
  const body = buildOpenRouterRequest(route, messages, {
    temperature: request.temperature,
    maxTokens: request.maxTokens,
  });

  // Override model if forced
  if (request.forceModel) {
    (body as any).model = request.forceModel;
    (body as any).models = [request.forceModel];
  }

  // Execute
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://siempre-swarm.local',
      'X-Title': 'Siempre Swarm',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  // Extract response
  const choice = data.choices?.[0];
  const content = choice?.message?.content || '';
  const usage = data.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const modelUsed = data.model || route.model.id;

  // Calculate cost (OpenRouter returns this in headers too)
  const actualCost = parseFloat(response.headers.get('x-openrouter-cost') || '0') ||
    route.estimatedCost;

  // Calculate what this would have cost on Opus
  const opusCost = (inputTokens / 1_000_000) * OPUS_COST_INPUT +
                   (outputTokens / 1_000_000) * OPUS_COST_OUTPUT;

  // Update stats
  stats.totalCalls++;
  stats.totalInputTokens += inputTokens;
  stats.totalOutputTokens += outputTokens;
  stats.totalCost += actualCost;
  stats.savedVsOpus += (opusCost - actualCost);
  stats.costByTier[route.tier] = (stats.costByTier[route.tier] || 0) + actualCost;
  stats.callsByTier[route.tier] = (stats.callsByTier[route.tier] || 0) + 1;

  return {
    content,
    model: modelUsed,
    tier: route.tier,
    inputTokens,
    outputTokens,
    cost: actualCost,
    latencyMs,
  };
}

/**
 * Get session statistics — how much we've spent and saved.
 */
export function getStats(): BridgeStats {
  return { ...stats };
}

/**
 * Reset session statistics.
 */
export function resetStats(): void {
  stats.totalCalls = 0;
  stats.totalInputTokens = 0;
  stats.totalOutputTokens = 0;
  stats.totalCost = 0;
  stats.costByTier = {};
  stats.callsByTier = {};
  stats.savedVsOpus = 0;
}

/**
 * Format stats for human-readable output.
 */
export function formatStats(): string {
  const s = getStats();
  if (s.totalCalls === 0) return 'No calls made yet.';

  const lines = [
    `Calls: ${s.totalCalls}`,
    `Tokens: ${s.totalInputTokens.toLocaleString()} in / ${s.totalOutputTokens.toLocaleString()} out`,
    `Cost: $${s.totalCost.toFixed(4)}`,
    `Saved vs Opus: $${s.savedVsOpus.toFixed(4)} (${s.savedVsOpus > 0 ? Math.round((s.savedVsOpus / (s.totalCost + s.savedVsOpus)) * 100) : 0}%)`,
    `By tier: ${Object.entries(s.callsByTier).map(([t, c]) => `${t}=${c}`).join(', ')}`,
  ];

  return lines.join('\n');
}
