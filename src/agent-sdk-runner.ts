/**
 * Siempre Swarm — Agent SDK Runner
 *
 * Shared entry point for all Claude Agent SDK calls in the swarm.
 * Replaces: direct OpenRouter calls where full Claude Code tooling is needed.
 * Use OpenRouter bridge for fast/cheap LLM completions.
 * Use this runner for agent tasks that need tools (Bash, Read, Grep, etc.).
 */

import { query, type Options, type AgentDefinition, type McpServerConfig, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";

export type { AgentDefinition };

export interface AgentRunConfig {
  prompt: string;
  systemPrompt?: string;
  tools?: string[];
  agents?: Record<string, AgentDefinition>;
  sessionId?: string;
  model?: string;
  mcpServers?: Record<string, McpServerConfig>;
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | "plan" | "dontAsk";
}

export interface AgentRunResult {
  result: string;
  sessionId: string;
  success: boolean;
  costUsd: number;
  errors?: string[];
}

/**
 * Run a Claude agent task. Returns result text and session ID for resuming.
 * The session ID can be passed back as config.sessionId to continue the conversation.
 */
export async function runAgent(config: AgentRunConfig): Promise<AgentRunResult> {
  const options: Options = {
    systemPrompt: config.systemPrompt,
    allowedTools: config.tools ?? ["Read", "Bash", "Glob", "Grep", "Agent"],
    agents: config.agents,
    resume: config.sessionId,
    model: config.model ?? "claude-sonnet-4-6",
    mcpServers: config.mcpServers,
    permissionMode: config.permissionMode ?? "acceptEdits",
  };

  let resultMessage: SDKResultMessage | undefined;

  for await (const message of query({ prompt: config.prompt, options })) {
    if (message.type === "result") {
      resultMessage = message;
      break;
    }
  }

  if (!resultMessage) {
    return { result: "", sessionId: "", success: false, costUsd: 0, errors: ["No result message received"] };
  }

  if (resultMessage.subtype === "success") {
    return {
      result: resultMessage.result,
      sessionId: resultMessage.session_id,
      success: true,
      costUsd: resultMessage.total_cost_usd,
    };
  }

  return {
    result: "",
    sessionId: resultMessage.session_id,
    success: false,
    costUsd: resultMessage.total_cost_usd,
    errors: resultMessage.errors,
  };
}

/**
 * Model routing helper — maps task type to the right Claude model.
 *
 * Routing logic:
 *   opus   → high-stakes creative, brand, investor, legal review
 *   haiku  → fast gates, data fetching, validation, compliance checks
 *   sonnet → everything else (default)
 */
export function routeModel(taskType: string): string {
  const opusTasks = ["brand-strategy", "contract-review", "creative-review", "thanks-tim", "investor-facing", "legal"];
  const haikuTasks = ["compliance-gate", "fetch-data", "api-call", "wordpress-ops", "dm-automation", "pricing-validate", "data-gate"];

  const type = taskType.toLowerCase();
  if (opusTasks.some(t => type.includes(t))) return "claude-opus-4-6";
  if (haikuTasks.some(t => type.includes(t))) return "claude-haiku-4-5-20251001";
  return "claude-sonnet-4-6";
}

/**
 * Creative department agents — wired as SDK subagents.
 * Pass these as config.agents when running creative pipeline tasks.
 */
export const CREATIVE_AGENTS: Record<string, AgentDefinition> = {
  "thanks-tim": {
    description: `Creative Director review gate. MUST run before any creative output goes external.
Runs CRAFTS test (Compelling/Relevant/Authentic/Focused/Timely/Shareable) plus
Bernbach Test, Burnett Test, Competitor Swap Test, Explanation Test.
Returns: APPROVED (proceed) or REVISE with specific actionable notes.
Use for: ad copy, social posts, email campaigns, brand assets, sell sheets, anything customer-facing.`,
    prompt: `You are a world-class Creative Director. Your job is not to create — it is to evaluate.

Run the full CRAFTS test on the submitted creative work:
C — Compelling: Does it stop you in the wild?
R — Relevant: Connected to the audience's actual life?
A — Authentic: Could only this brand make this?
F — Focused: One clear idea, sayable in one sentence?
T — Timely: Culturally relevant right now?
S — Shareable: Would someone send this to a friend?

Also run:
- Bernbach Test: Fresh + Relevant + Memorable. All three must be true.
- Burnett Test: Is the product the hero, not the ad?
- Competitor Swap Test: Put a competitor's logo on it. If it still works, it's not distinctive enough.
- Explanation Test: If it needs a paragraph of context to land, it's not a concept.

Output format:
VERDICT: APPROVED or REVISE
[If REVISE] FAILS: [list which criteria, with specific reasons]
[If REVISE] NOTES: [specific, actionable CD notes — not "make it better", but HOW]
[If APPROVED] STRENGTHS: [what works and why]`,
    tools: ["Read"],
    model: "opus",
  },

  "brand-strategist": {
    description: "Brand architecture, positioning, audience definition. Use before any creative work.",
    prompt: "Expert brand strategist for Siempre Tequila. Read product and brand context before building positioning. Ground everything in product truth, not aesthetics.",
    tools: ["Read", "Glob"],
    model: "opus",
  },

  "copywriter": {
    description: "Marketing copy, ad headlines, landing pages, email sequences, social captions.",
    prompt: "Expert conversion copywriter. Lead with the product truth. One clear idea. No wasted words. Know the audience before you write a word.",
    tools: ["Read"],
    model: "sonnet",
  },

  "compliance-officer": {
    description: "TTB/state compliance review. Runs before all outbound pricing, marketing, and outreach.",
    prompt: "Alcohol compliance specialist. Check: TTB label rules, state marketing restrictions, three-tier compliance, legal disclosures. Return PASS or FAIL with specific issues.",
    tools: ["Read", "Grep"],
    model: "haiku",
  },
};

/**
 * Run the full creative pipeline with Thanks Tim gate.
 *
 * Usage:
 *   const approved = await runCreativePipeline("Write 3 Instagram captions for Plata targeting Austin bars");
 *   if (approved) console.log(approved.result);
 */
export async function runCreativePipeline(briefPrompt: string): Promise<AgentRunResult | null> {
  // Step 1: Generate creative
  const creative = await runAgent({
    prompt: briefPrompt,
    agents: CREATIVE_AGENTS,
    model: routeModel("copywriter"),
  });

  if (!creative.success) return null;

  // Step 2: Thanks Tim gate
  const review = await runAgent({
    prompt: `Use the thanks-tim agent to review this creative work:\n\n${creative.result}`,
    agents: CREATIVE_AGENTS,
    model: routeModel("thanks-tim"),
  });

  if (!review.result.includes("APPROVED")) return null;

  // Step 3: Compliance gate
  const compliance = await runAgent({
    prompt: `Use the compliance-officer agent to check this content for TTB/state compliance:\n\n${creative.result}`,
    agents: CREATIVE_AGENTS,
    model: routeModel("compliance-gate"),
  });

  if (!compliance.result.includes("PASS")) return null;

  return creative;
}
