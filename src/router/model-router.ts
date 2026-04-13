/**
 * Model Router — Routes tasks to the optimal model based on complexity.
 *
 * Uses OpenRouter as the API gateway for multi-model access.
 * Preserves Opus/Sonnet for complex reasoning, routes simple
 * tasks to free or cheap models to save tokens and avoid usage caps.
 */

export type TaskTier = 'free' | 'budget' | 'mid' | 'top';

export type TaskCategory =
  | 'classify'      // Simple classification, tagging
  | 'summarize'     // Summarize text, extract key points
  | 'format'        // Formatting, restructuring
  | 'lookup'        // Simple data retrieval
  | 'code_simple'   // Boilerplate, simple functions
  | 'code_complex'  // Architecture, complex logic
  | 'reason'        // Complex reasoning, synthesis
  | 'draft'         // Writing drafts (emails, docs)
  | 'review'        // Code/content review
  | 'research';     // Web research, analysis

interface ModelConfig {
  id: string;
  tier: TaskTier;
  contextWindow: number;
  costPerMInput: number;   // $ per million input tokens
  costPerMOutput: number;  // $ per million output tokens
}

// Models ordered by preference within each tier.
// Aligned with openrouter-stack.skill research (March 2026 verified pricing).
// Escalation ladder: Free → Budget → Mid → Top. Never skip tiers.
const MODEL_REGISTRY: Record<TaskTier, ModelConfig[]> = {
  // Free tier — handles 80% of tasks. Always start here.
  free: [
    { id: 'qwen/qwen3.6-plus:free', tier: 'free', contextWindow: 1_000_000, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', tier: 'free', contextWindow: 131_072, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'deepseek/deepseek-r1:free', tier: 'free', contextWindow: 163_840, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', tier: 'free', contextWindow: 262_144, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'qwen/qwen3-coder:free', tier: 'free', contextWindow: 262_000, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'google/gemma-3-27b-it:free', tier: 'free', contextWindow: 131_072, costPerMInput: 0, costPerMOutput: 0 },
  ],
  // Budget tier — DeepSeek V3.2 is the default paid choice.
  // 90% of GPT-5.4 quality at 1/50th cost. 90% cache discount.
  budget: [
    { id: 'deepseek/deepseek-v3.2', tier: 'budget', contextWindow: 163_840, costPerMInput: 0.26, costPerMOutput: 0.38 },
    { id: 'google/gemini-2.0-flash-lite', tier: 'budget', contextWindow: 1_000_000, costPerMInput: 0.075, costPerMOutput: 0.30 },
    { id: 'google/gemini-3.1-flash-lite', tier: 'budget', contextWindow: 1_000_000, costPerMInput: 0.25, costPerMOutput: 1.50 },
  ],
  // Mid tier — Anthropic when voice/nuance matters.
  mid: [
    { id: 'anthropic/claude-haiku-4-5', tier: 'mid', contextWindow: 200_000, costPerMInput: 1.00, costPerMOutput: 5.00 },
    { id: 'anthropic/claude-sonnet-4-6', tier: 'mid', contextWindow: 1_000_000, costPerMInput: 3.00, costPerMOutput: 15.00 },
  ],
  // Top tier — last resort. Only when Sonnet genuinely fails.
  top: [
    { id: 'anthropic/claude-opus-4-6', tier: 'top', contextWindow: 200_000, costPerMInput: 5.00, costPerMOutput: 25.00 },
  ],
};

// Task → Tier mapping. Bias toward free/budget. Escalate deliberately.
// Matches openrouter-stack.skill escalation ladder.
const TASK_TIER_MAP: Record<TaskCategory, TaskTier> = {
  classify: 'free',
  summarize: 'free',
  format: 'free',
  lookup: 'free',
  draft: 'free',         // First drafts are free. Polish escalates.
  code_simple: 'free',
  research: 'budget',    // DeepSeek V3.2 — handles 90% of research
  review: 'budget',      // DeepSeek V3.2 — good enough for most reviews
  code_complex: 'mid',   // Sonnet when architecture matters
  reason: 'mid',         // Sonnet first, not Opus. Escalate manually if needed.
};

export interface RouteResult {
  model: ModelConfig;
  tier: TaskTier;
  fallbacks: ModelConfig[];
  estimatedCost: number; // estimated cost for ~1K tokens in/out
}

/**
 * Route a task to the optimal model based on its category.
 */
export function routeTask(category: TaskCategory, promptTokens?: number): RouteResult {
  const tier = TASK_TIER_MAP[category];
  const models = MODEL_REGISTRY[tier];
  const primary = models[0];
  const fallbacks = models.slice(1);

  // If the prompt exceeds the primary model's context, find one that fits
  if (promptTokens && promptTokens > primary.contextWindow) {
    const fitting = models.find(m => m.contextWindow >= promptTokens);
    if (fitting) {
      return {
        model: fitting,
        tier,
        fallbacks: models.filter(m => m.id !== fitting.id && m.contextWindow >= promptTokens),
        estimatedCost: estimateCost(fitting, promptTokens),
      };
    }
    // Fall up to a higher tier with more context
    return routeToLargerContext(promptTokens, tier);
  }

  return {
    model: primary,
    tier,
    fallbacks,
    estimatedCost: estimateCost(primary, promptTokens || 1000),
  };
}

/**
 * Classify task complexity using simple heuristics.
 * This runs locally — no API call needed.
 */
export function classifyTask(prompt: string): TaskCategory {
  const lower = prompt.toLowerCase();
  const wordCount = prompt.split(/\s+/).length;

  // Short prompts are usually simple
  if (wordCount < 20) {
    if (lower.includes('classify') || lower.includes('categorize') || lower.includes('tag')) return 'classify';
    if (lower.includes('format') || lower.includes('convert')) return 'format';
    if (lower.includes('look up') || lower.includes('find') || lower.includes('what is')) return 'lookup';
  }

  // Code-related
  if (lower.includes('implement') || lower.includes('build') || lower.includes('create function')) {
    return wordCount > 100 || lower.includes('architect') || lower.includes('design') ? 'code_complex' : 'code_simple';
  }

  // Writing
  if (lower.includes('draft') || lower.includes('write email') || lower.includes('compose')) return 'draft';
  if (lower.includes('summarize') || lower.includes('tldr') || lower.includes('key points')) return 'summarize';

  // Analysis and research — route to FREE, not top. These are structured tasks
  // that free models handle well. Only escalate to top for true multi-step reasoning.
  if (lower.includes('analyze') || lower.includes('compare') || lower.includes('list') ||
      lower.includes('describe') || lower.includes('explain') || lower.includes('report')) return 'summarize';
  if (lower.includes('research') || lower.includes('investigate') || lower.includes('find out')) return 'research';
  if (lower.includes('review') || lower.includes('audit') || lower.includes('check')) return 'review';

  // Complex reasoning — ONLY for true multi-step strategy/decision tasks
  if (lower.includes('strategy') && lower.includes('trade-off')) return 'reason';
  if (lower.includes('decision') && (lower.includes('weigh') || lower.includes('pros and cons'))) return 'reason';

  // Default: bias toward free. Only use top tier if explicitly complex.
  return wordCount > 300 ? 'research' : 'summarize';
}

/**
 * Get the OpenRouter API request body for a routed task.
 */
export function buildOpenRouterRequest(
  route: RouteResult,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): object {
  return {
    model: route.model.id,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
    route: 'fallback',
    models: [route.model.id, ...route.fallbacks.slice(0, 2).map(f => f.id)],
  };
}

// --- Internal helpers ---

function estimateCost(model: ModelConfig, inputTokens: number): number {
  const outputTokens = Math.min(inputTokens, 2000); // rough estimate
  return (inputTokens / 1_000_000) * model.costPerMInput +
         (outputTokens / 1_000_000) * model.costPerMOutput;
}

function routeToLargerContext(tokens: number, fromTier: TaskTier): RouteResult {
  const tierOrder: TaskTier[] = ['free', 'budget', 'mid', 'top'];
  const startIdx = tierOrder.indexOf(fromTier);

  for (let i = startIdx; i < tierOrder.length; i++) {
    const models = MODEL_REGISTRY[tierOrder[i]];
    const fitting = models.find(m => m.contextWindow >= tokens);
    if (fitting) {
      return {
        model: fitting,
        tier: tierOrder[i],
        fallbacks: models.filter(m => m.id !== fitting.id && m.contextWindow >= tokens),
        estimatedCost: estimateCost(fitting, tokens),
      };
    }
  }

  // Last resort: top tier
  const topModel = MODEL_REGISTRY.top[0];
  return {
    model: topModel,
    tier: 'top',
    fallbacks: [],
    estimatedCost: estimateCost(topModel, tokens),
  };
}
