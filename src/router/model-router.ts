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
// Free models rotate on OpenRouter — fallbacks handle unavailability.
const MODEL_REGISTRY: Record<TaskTier, ModelConfig[]> = {
  // Updated 2026-04-04 from live OpenRouter /models endpoint
  free: [
    { id: 'qwen/qwen3.6-plus:free', tier: 'free', contextWindow: 1_000_000, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', tier: 'free', contextWindow: 262_144, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'qwen/qwen3-coder:free', tier: 'free', contextWindow: 262_000, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'google/gemma-3-27b-it:free', tier: 'free', contextWindow: 131_072, costPerMInput: 0, costPerMOutput: 0 },
    { id: 'nousresearch/hermes-3-llama-3.1-405b:free', tier: 'free', contextWindow: 131_072, costPerMInput: 0, costPerMOutput: 0 },
  ],
  budget: [
    { id: 'google/gemini-2.0-flash-001', tier: 'budget', contextWindow: 1_000_000, costPerMInput: 0.10, costPerMOutput: 0.40 },
    { id: 'deepseek/deepseek-chat', tier: 'budget', contextWindow: 64_000, costPerMInput: 0.14, costPerMOutput: 0.28 },
  ],
  mid: [
    { id: 'anthropic/claude-3.5-haiku', tier: 'mid', contextWindow: 200_000, costPerMInput: 0.80, costPerMOutput: 4.00 },
    { id: 'anthropic/claude-sonnet-4', tier: 'mid', contextWindow: 200_000, costPerMInput: 3.00, costPerMOutput: 15.00 },
  ],
  top: [
    { id: 'anthropic/claude-opus-4', tier: 'top', contextWindow: 200_000, costPerMInput: 15.00, costPerMOutput: 75.00 },
  ],
};

// Task → Tier mapping. Simple tasks go to free models.
const TASK_TIER_MAP: Record<TaskCategory, TaskTier> = {
  classify: 'free',
  summarize: 'free',
  format: 'free',
  lookup: 'free',
  draft: 'free',
  code_simple: 'free',
  research: 'budget',
  review: 'mid',
  code_complex: 'mid',
  reason: 'top',
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
