/**
 * Siempre Swarm Orchestrator
 *
 * The central nervous system. Receives tasks, routes them to the
 * right department, spawns agents, collects results, and maintains
 * the executive briefing.
 *
 * Flow:
 *   Task in → classify → route to department → select agent →
 *   check governance → spawn (via OpenRouter or Claude Code Task) →
 *   store results in supermemory → report up
 */

import { join } from 'path';
import { DEPARTMENTS, routeToDepartment, getAllAgents, type DepartmentId } from './departments/registry.js';
import { classifyTask, routeTask, type TaskCategory } from './router/model-router.js';
import { execute, getStats, formatStats, type BridgeRequest, type BridgeResponse } from './router/openrouter-bridge.js';
import { SupermemoryClient, DEPARTMENT_TAGS, type SearchOptions } from './memory/supermemory-client.js';
import { acquireFileLock, releaseAgentLocks, checkBranchIsolation, cleanExpiredLocks } from './governance/session-lock.js';
import { EventBus, createEvent } from './events/index.js';
import { validatePacket, fromPrompt, type TaskPacket } from './tasks/packet.js';
import type { AgentTask, ExecutiveBriefing, DepartmentReport } from './departments/types.js';
import type { EventSource, FailureClass } from './events/index.js';
import { buildDataContext, extractMarkets } from './data/vault-client.js';
import { buildMexicoOpsAgentContext } from './departments/mexico-ops-data-bridge.js';

export interface OrchestratorConfig {
  openRouterApiKey: string;
  supermemoryApiKey: string;
  projectDir: string;
  verbose?: boolean;
  eventLogDir?: string;            // Directory for JSONL event logs
}

export class Orchestrator {
  private openRouterKey: string;
  private memory: SupermemoryClient;
  private projectDir: string;
  private verbose: boolean;
  private activeTasks: Map<string, AgentTask> = new Map();
  private completedTasks: AgentTask[] = [];
  readonly events: EventBus;

  constructor(config: OrchestratorConfig) {
    this.openRouterKey = config.openRouterApiKey;
    this.memory = new SupermemoryClient(config.supermemoryApiKey);
    this.projectDir = config.projectDir;
    this.verbose = config.verbose ?? false;
    this.events = new EventBus({
      logDir: config.eventLogDir ?? join(config.projectDir, 'data', 'events'),
    });
  }

  /**
   * Process a task from Alex. This is the main entry point.
   *
   * 1. Classify the task
   * 2. Route to a department
   * 3. Select the best agent
   * 4. Check governance (locks, branch isolation)
   * 5. Execute via OpenRouter (for cheap tasks) or return a prompt
   *    for Claude Code Task tool (for complex tasks)
   * 6. Store results in supermemory
   * 7. Return results
   */
  async processTask(prompt: string, options?: {
    department?: DepartmentId;
    agentId?: string;
    category?: TaskCategory;
    files?: string[];               // Files this task will touch (for locking)
  }): Promise<TaskResult> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const src: EventSource = { component: 'orchestrator' };

    // Step 1: Classify
    const category = options?.category || classifyTask(prompt);
    const route = routeTask(category);

    this.events.emit(createEvent('task.created', src, {
      prompt,
      category,
      tier: route.tier,
    }, taskId));

    if (this.verbose) {
      console.log(`[orchestrator] Task ${taskId}: category=${category}, tier=${route.tier}`);
    }

    // Step 2: Route to department
    const deptId = options?.department || routeToDepartment(prompt);
    if (!deptId) {
      this.events.emit(createEvent('task.blocked', src, {
        reason: 'No department matched for this task',
        blocker: 'no_department_match',
      }, taskId));
      return {
        taskId,
        status: 'completed',
        content: `No department matched for this task. Route manually or rephrase.`,
        metadata: { category, tier: route.tier },
      };
    }

    const dept = DEPARTMENTS[deptId];
    if (this.verbose) {
      console.log(`[orchestrator] Routed to: ${dept.name}`);
    }

    // Step 3: Select agent
    const agent = options?.agentId
      ? [...dept.agents, dept.director].find(a => a.id === options.agentId)
      : selectBestAgent(dept, prompt);

    if (!agent) {
      this.events.emit(createEvent('task.blocked', src, {
        reason: `No suitable agent found in ${dept.name}`,
        blocker: 'no_agent_match',
      }, taskId));
      return {
        taskId,
        status: 'failed',
        content: `No suitable agent found in ${dept.name}.`,
        metadata: { category, tier: route.tier, department: deptId },
      };
    }

    if (this.verbose) {
      console.log(`[orchestrator] Agent: ${agent.name} (${agent.id}), tier=${agent.modelTier}`);
    }

    this.events.emit(createEvent('task.routed', { component: 'router', department: deptId }, {
      department: deptId,
      agentId: agent.id,
      agentName: agent.name,
      modelTier: (agent as any).modelTier || route.tier,
    }, taskId));

    // Step 4: Governance checks
    if (options?.files) {
      const lockResult = acquireFileLock(this.projectDir, agent.id, deptId, options.files);
      if (!lockResult.acquired) {
        this.events.emit(createEvent('task.blocked', { component: 'governance' }, {
          reason: `Governance lock conflict: ${lockResult.conflict?.reason}`,
          blocker: 'governance_lock',
        }, taskId));
        return {
          taskId,
          status: 'blocked',
          content: `Governance block: ${lockResult.conflict?.reason}`,
          metadata: { category, tier: route.tier, department: deptId, agent: agent.id },
        };
      }
    }

    // Step 5: Record active task
    const agentTask: AgentTask = {
      id: taskId,
      department: deptId,
      assignedAgent: agent.id,
      prompt,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    };
    this.activeTasks.set(taskId, agentTask);

    // Step 5b: Inject live data into prompts for data-driven departments.
    // Agents respond with real numbers instead of training-data hallucinations.
    let enrichedPrompt = prompt;
    if (deptId === 'sales_intel') {
      try {
        const markets = extractMarkets(prompt);
        const vaultContext = await buildDataContext(markets.length > 0 ? markets : undefined);
        if (vaultContext) {
          enrichedPrompt = `${vaultContext}\n\n---\n\n## Task\n${prompt}`;
          if (this.verbose) {
            console.log(`[orchestrator] Injected vault data for ${markets.length} markets`);
          }
        }
      } catch {
        // Vault unavailable — proceed without live data
        if (this.verbose) {
          console.log(`[orchestrator] Vault unavailable — proceeding without live data`);
        }
      }
    } else if (deptId === 'mexico_ops') {
      try {
        const mexContext = await buildMexicoOpsAgentContext(agent.id);
        if (mexContext) {
          enrichedPrompt = `${mexContext}\n\n---\n\n## Task\n${prompt}`;
          if (this.verbose) {
            console.log(`[orchestrator] Injected Mexico Ops live data for ${agent.id}`);
          }
        }
      } catch {
        if (this.verbose) {
          console.log(`[orchestrator] Mexico Ops data bridge unavailable — proceeding with static context`);
        }
      }
    }

    // Step 6: Execute
    // Use the AGENT's model tier (not the task classifier's tier).
    // The agent knows what level of intelligence its work requires.
    // Free/budget agents → OpenRouter. Mid/top agents → Claude Code Task tool.
    const effectiveTier = (agent as any).modelTier || route.tier;

    if (effectiveTier === 'free' || effectiveTier === 'budget') {
      this.events.emit(createEvent('task.executing', { component: 'orchestrator', agentId: agent.id, department: deptId }, {
        model: route.model.id,
        tier: effectiveTier,
      }, taskId));

      try {
        const response = await this.executeViaOpenRouter(agent, enrichedPrompt, category);

        this.events.emit(createEvent('task.completed', { component: 'orchestrator', agentId: agent.id, department: deptId }, {
          model: response.model,
          cost: response.cost,
          latencyMs: response.latencyMs,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          contentLength: response.content.length,
        }, taskId));

        // Store result in supermemory
        await this.storeResult(agent.containerTag, taskId, prompt, response.content);

        // Update task
        agentTask.status = 'completed';
        agentTask.result = response.content;
        agentTask.modelUsed = response.model;
        agentTask.cost = response.cost;
        agentTask.completedAt = new Date().toISOString();
        this.activeTasks.delete(taskId);
        this.completedTasks.push(agentTask);

        // Release locks
        releaseAgentLocks(this.projectDir, agent.id);

        // Build review package for Claude (Opus) to inspect before
        // presenting to Alex. The free model did the work — Opus
        // applies judgment, context, and quality control.
        const reviewPackage = this.buildReviewPackage(
          agentTask, response, agent as any, deptId, prompt
        );

        return {
          taskId,
          status: 'pending_review',
          content: response.content,
          review: reviewPackage,
          metadata: {
            category,
            tier: route.tier,
            department: deptId,
            agent: agent.id,
            model: response.model,
            cost: response.cost,
            latencyMs: response.latencyMs,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
          },
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const failureClass: FailureClass = errorMsg.includes('timeout') ? 'openrouter_timeout'
          : errorMsg.includes('rate') ? 'openrouter_rate_limit'
          : errorMsg.includes('model') ? 'openrouter_model_unavailable'
          : 'unknown';

        this.events.emit(createEvent('task.failed', { component: 'orchestrator', agentId: agent.id, department: deptId }, {
          error: errorMsg,
          failureClass,
          recoverable: failureClass !== 'unknown',
        }, taskId));

        agentTask.status = 'failed';
        this.activeTasks.delete(taskId);
        releaseAgentLocks(this.projectDir, agent.id);

        return {
          taskId,
          status: 'failed',
          content: `OpenRouter execution failed: ${errorMsg}`,
          metadata: { category, tier: route.tier, department: deptId, agent: agent.id },
        };
      }
    } else {
      // Mid/Top tier — return a structured prompt for Claude Code Task tool.
      // The orchestrator doesn't execute these directly — it hands them back
      // to Claude Code (me) with full context for Task tool spawning.
      const taskPrompt = this.buildTaskToolPrompt(agent, enrichedPrompt, deptId);

      return {
        taskId,
        status: 'requires_task_tool',
        content: taskPrompt,
        metadata: {
          category,
          tier: route.tier,
          department: deptId,
          agent: agent.id,
          suggestedModel: route.model.id,
        },
      };
    }
  }

  /**
   * Build a review package for Claude (Opus) to inspect agent work.
   *
   * This is the "boss checks the employee's work" layer.
   * The free model did the heavy lifting — Opus applies:
   * - Quality judgment (is this actually good?)
   * - Context awareness (does this conflict with what we know?)
   * - Accuracy check (are the numbers/facts plausible?)
   * - Completeness check (did the agent miss anything?)
   * - Recommendation (approve, revise, or redo?)
   */
  private buildReviewPackage(
    task: AgentTask,
    response: BridgeResponse,
    agent: { id: string; name: string; department: string },
    deptId: DepartmentId,
    originalPrompt: string
  ): ReviewPackage {
    return {
      summary: `${agent.name} (${DEPARTMENTS[deptId].name}) completed task using ${response.model} [${response.tier} tier, $${response.cost.toFixed(6)}]`,
      originalPrompt,
      agentOutput: response.content,
      agentId: agent.id,
      department: deptId,
      model: response.model,
      tier: response.tier,
      cost: response.cost,
      reviewPrompt: [
        `## Review Request`,
        ``,
        `**Agent:** ${agent.name} (${agent.id})`,
        `**Department:** ${DEPARTMENTS[deptId].name}`,
        `**Model:** ${response.model} (${response.tier} tier, $${response.cost.toFixed(6)})`,
        `**Tokens:** ${response.inputTokens} in / ${response.outputTokens} out`,
        ``,
        `**Original Task:**`,
        originalPrompt,
        ``,
        `**Agent's Work:**`,
        response.content,
        ``,
        `**Review Checklist:**`,
        `1. QUALITY — Is this work good enough to present to Alex?`,
        `2. ACCURACY — Are the facts, numbers, and claims plausible? Flag anything that needs verification.`,
        `3. CONTEXT — Does this conflict with anything we know from recent sessions, supermemory, or project state?`,
        `4. COMPLETENESS — Did the agent miss anything the original prompt asked for?`,
        `5. JUDGMENT — Would you change anything before Alex sees this?`,
        ``,
        `**Your recommendation:** APPROVE (present as-is) | ANNOTATE (present with your notes) | REVISE (you fix specific issues) | REDO (task needs to be re-run)`,
      ].join('\n'),
    };
  }

  /**
   * Execute a task via OpenRouter using a free/cheap model.
   */
  private async executeViaOpenRouter(
    agent: { systemPrompt: string; modelTier: string },
    prompt: string,
    category: TaskCategory
  ): Promise<BridgeResponse> {
    return execute(this.openRouterKey, {
      prompt,
      systemPrompt: agent.systemPrompt,
      category,
    });
  }

  /**
   * Build a structured prompt for Claude Code's Task tool.
   * This is for complex tasks that need Opus/Sonnet.
   */
  private buildTaskToolPrompt(
    agent: { id: string; name: string; systemPrompt: string; department: string },
    prompt: string,
    deptId: DepartmentId
  ): string {
    return [
      `## Agent: ${agent.name} (${agent.id})`,
      `## Department: ${DEPARTMENTS[deptId].name}`,
      ``,
      `### System Context`,
      agent.systemPrompt,
      ``,
      `### Task`,
      prompt,
      ``,
      `### Instructions`,
      `- Store findings in supermemory containerTag: ${(agent as any).containerTag || `dept_${deptId}`}`,
      `- Report back with a structured summary`,
      `- If you need information from other departments, note what you need — don't cross-search yourself`,
    ].join('\n');
  }

  /**
   * Store a task result in supermemory for persistence.
   */
  private async storeResult(
    containerTag: string,
    taskId: string,
    prompt: string,
    result: string
  ): Promise<void> {
    try {
      await this.memory.addMemory({
        content: `Task: ${prompt}\n\nResult: ${result}`,
        containerTag,
        metadata: {
          taskId,
          type: 'task_result',
          timestamp: new Date().toISOString(),
        },
        customId: taskId,
      });
      this.events.emit(createEvent('memory.store', { component: 'memory' }, {
        containerTag,
        success: true,
      }, taskId));
    } catch (error) {
      this.events.emit(createEvent('memory.store', { component: 'memory' }, {
        containerTag,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }, taskId));
      // Don't fail the task if memory storage fails
      if (this.verbose) {
        console.error(`[orchestrator] Failed to store result in supermemory:`, error);
      }
    }
  }

  /**
   * Process a structured TaskPacket — the preferred entry point.
   * Validates the packet, then delegates to processTask with
   * the packet's routing and governance hints.
   */
  async processPacket(packet: TaskPacket): Promise<TaskResult> {
    const validation = validatePacket(packet);
    if (!validation.valid) {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.events.emit(createEvent('task.failed', { component: 'orchestrator' }, {
        error: `Invalid task packet: ${validation.errors.join('; ')}`,
        failureClass: 'invalid_task_packet',
        recoverable: false,
      }, taskId));
      return {
        taskId,
        status: 'failed',
        content: `Task packet validation failed:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`,
        metadata: { validationErrors: validation.errors },
      };
    }

    return this.processTask(packet.prompt, {
      department: packet.routing?.department,
      agentId: packet.routing?.agentId,
      files: packet.files,
    });
  }

  /**
   * Convenience: wrap a raw prompt string in a TaskPacket and process it.
   * This is the migration path from the old string interface.
   */
  async processPrompt(prompt: string, department?: DepartmentId): Promise<TaskResult> {
    return this.processPacket(fromPrompt(prompt, department));
  }

  /**
   * Search across department memories for cross-cutting insights.
   */
  async searchMemory(query: string, departments?: DepartmentId[]): Promise<any[]> {
    const tags = departments
      ? departments.map(d => DEPARTMENTS[d].containerTag)
      : Object.values(DEPARTMENT_TAGS);

    return this.memory.search({
      query,
      containerTags: tags,
      searchMode: 'hybrid',
      limit: 10,
      rerank: true,
    });
  }

  /**
   * Get the executive briefing — the master document.
   * Aggregates reports from all departments.
   */
  async getExecutiveBriefing(): Promise<ExecutiveBriefing> {
    const departments: DepartmentReport[] = [];
    const now = new Date().toISOString();

    for (const [id, dept] of Object.entries(DEPARTMENTS)) {
      const deptTasks = this.completedTasks.filter(t => t.department === id);
      const pendingTasks = [...this.activeTasks.values()].filter(t => t.department === id);

      // Try to get department profile from supermemory
      let summary = `${dept.name}: ${deptTasks.length} completed, ${pendingTasks.length} pending`;
      try {
        const profile = await this.memory.getProfile(dept.containerTag, 'current status and recent activity');
        if (profile.dynamic.length > 0) {
          summary = profile.dynamic.join('. ');
        }
      } catch {
        // Profile not available yet — use basic stats
      }

      departments.push({
        department: id as DepartmentId,
        summary,
        completedTasks: deptTasks.length,
        pendingTasks: pendingTasks.length,
        totalCost: deptTasks.reduce((sum, t) => sum + (t.cost || 0), 0),
        updatedAt: now,
      });
    }

    // Identify alerts and pending decisions
    const alerts: string[] = [];
    const decisions: string[] = [];

    for (const task of this.activeTasks.values()) {
      if (task.status === 'in_progress') {
        const elapsed = Date.now() - new Date(task.createdAt).getTime();
        if (elapsed > 5 * 60 * 1000) { // 5+ minutes
          alerts.push(`Task ${task.id} (${task.assignedAgent}) has been running for ${Math.round(elapsed / 60000)}min`);
        }
      }
    }

    const routerStats = getStats();

    return {
      generatedAt: now,
      departments,
      alerts,
      decisions,
      totalCostToday: routerStats.totalCost,
      tokensSavedByRouting: routerStats.savedVsOpus > 0
        ? Math.round((routerStats.savedVsOpus / (routerStats.totalCost + routerStats.savedVsOpus)) * 100)
        : 0,
    };
  }

  /**
   * Get routing stats — how much money we're saving.
   */
  getRoutingStats(): string {
    return formatStats();
  }

  /**
   * Clean up expired governance locks.
   */
  cleanup(): number {
    return cleanExpiredLocks(this.projectDir);
  }
}

// ============================================================================
// Helper: Select the best agent for a task within a department
// ============================================================================

function selectBestAgent(dept: typeof DEPARTMENTS[DepartmentId], prompt: string): typeof dept.director | undefined {
  const lower = prompt.toLowerCase();
  let bestAgent: typeof dept.director | undefined;
  let bestScore = 0;

  for (const agent of dept.agents) {
    let score = 0;

    // Check capabilities
    for (const cap of agent.capabilities) {
      const capWords = cap.replace(/_/g, ' ').toLowerCase();
      if (lower.includes(capWords)) score += 2;
    }

    // Check agent name (e.g., "Virginia Pricing Agent" matches "virginia")
    const nameWords = agent.name.toLowerCase().split(/\s+/);
    for (const word of nameWords) {
      if (word.length > 2 && lower.includes(word)) score += 3;
    }

    // Check agent ID (e.g., "pricing_va" matches "virginia" via the name check above)
    if (lower.includes(agent.id.replace(/_/g, ' '))) score += 2;

    // Check description keywords
    const descWords = agent.description.toLowerCase().split(/\s+/);
    for (const word of descWords) {
      if (word.length > 4 && lower.includes(word)) score += 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  // Return best specialist if score > 0, otherwise department director
  return bestScore > 0 ? bestAgent : dept.director;
}

// ============================================================================
// Types
// ============================================================================

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'blocked' | 'requires_task_tool' | 'pending_review';
  content: string;
  review?: ReviewPackage;
  metadata?: Record<string, unknown>;
}

export interface ReviewPackage {
  summary: string;
  originalPrompt: string;
  agentOutput: string;
  agentId: string;
  department: DepartmentId;
  model: string;
  tier: string;
  cost: number;
  reviewPrompt: string;         // Structured prompt for Opus to review the work
}
