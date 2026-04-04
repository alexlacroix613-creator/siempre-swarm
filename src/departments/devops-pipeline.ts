/**
 * DevOps Pipeline — Deploy → Verify → Monitor.
 *
 * Handles the full lifecycle of getting code from branch to production.
 * Opus reviews deployment plans before execution.
 * Verify agent confirms everything works after deploy.
 *
 * Pipeline:
 *   1. PLAN — What's being deployed? Where? What could break?
 *   2. PRE_FLIGHT — Check git status, branch, tests, dependencies
 *   3. OPUS_REVIEW — I review the deployment plan before execution
 *   4. DEPLOY — Execute the deployment (ONLY after Opus + Alex approve)
 *   5. VERIFY — Automated health checks, smoke tests
 *   6. REPORT — Status report: what deployed, what's live, any issues
 *
 * IMPORTANT: Deploy agent NEVER pushes to remote without Alex's approval.
 * This respects the CLAUDE.md rule: "Push to any remote without explicit
 * instruction from Alex" is on the Hard No List.
 */

export const DEVOPS_PIPELINE_STAGES = [
  'plan',         // What, where, risks
  'pre_flight',   // Git status, tests, dependencies
  'opus_review',  // Review deployment plan
  'deploy',       // Execute (ONLY with approval)
  'verify',       // Health checks, smoke tests
  'report',       // Status report
] as const;

export type DevOpsPipelineStage = typeof DEVOPS_PIPELINE_STAGES[number];

export type DevOpsTaskType =
  | 'deploy'          // Full commit → push → deploy → verify
  | 'health_check'    // Check if services are running
  | 'status_report'   // What's deployed where
  | 'rollback';       // Something went wrong, roll back

export function classifyDevOpsTask(prompt: string): DevOpsTaskType {
  const lower = prompt.toLowerCase();

  if (lower.includes('rollback') || lower.includes('revert') || lower.includes('undo deploy'))
    return 'rollback';
  if (lower.includes('health') || lower.includes('alive') || lower.includes('running') || lower.includes('up?'))
    return 'health_check';
  if (lower.includes('status') || lower.includes('what\'s deployed') || lower.includes('deployment map'))
    return 'status_report';

  return 'deploy';
}

export function getDevOpsStages(taskType: DevOpsTaskType): DevOpsPipelineStage[] {
  switch (taskType) {
    case 'health_check':
      return ['verify', 'report'];
    case 'status_report':
      return ['report'];
    case 'deploy':
      return ['plan', 'pre_flight', 'opus_review', 'deploy', 'verify', 'report'];
    case 'rollback':
      return ['plan', 'opus_review', 'deploy', 'verify', 'report'];
  }
}

/**
 * Known deployment targets.
 * DevOps agents reference this to know where things go.
 */
export const DEPLOYMENT_TARGETS = {
  combobulator: { platform: 'Netlify', url: 'combobulator.tech', type: 'static' },
  fieldkit: { platform: 'Netlify', url: 'fieldkit-ai.netlify.app', type: 'functions' },
  reviewshield_landing: { platform: 'Netlify', url: 'reviewshield-landing.netlify.app', type: 'static' },
  reviewshield_api: { platform: 'Mac mini (Optimus)', url: '100.103.182.114:8000', type: 'server' },
  incentive_planner: { platform: 'Netlify', url: 'siempre-incentive-planner.netlify.app', type: 'static' },
  billy: { platform: 'Local', url: 'localhost:5055', type: 'flask' },
  siempre_command: { platform: 'Local', url: 'localhost:5050', type: 'flask' },
} as const;

export function buildDevOpsReviewPrompt(
  taskType: DevOpsTaskType,
  target: string,
  agentOutput: string,
  originalPrompt: string
): string {
  return [
    `## DevOps Review (${taskType} → ${target})`,
    ``,
    `**Original Request:** ${originalPrompt}`,
    ``,
    `**Agent Plan:**`,
    agentOutput,
    ``,
    `## DevOps-Specific Review Checklist`,
    ``,
    `### 1. SAFETY`,
    `- Is this a destructive operation? (force push, reset, delete)`,
    `- Are we on the right branch?`,
    `- Is the working tree clean?`,
    `- Will this affect other running services?`,
    ``,
    `### 2. CORRECTNESS`,
    `- Is the deployment target correct? (right URL, right platform)`,
    `- Are environment variables set?`,
    `- Did tests pass?`,
    ``,
    `### 3. ROLLBACK PLAN`,
    `- If this goes wrong, how do we undo it?`,
    `- Is the previous version tagged/accessible?`,
    ``,
    `### 4. ALEX APPROVAL`,
    `- Does this require pushing to remote? → MUST have Alex's explicit approval`,
    `- Does this touch production? → Confirm with Alex`,
    ``,
    `**Recommendation:** APPROVE (proceed) | HOLD (need Alex's input) | ABORT (unsafe)`,
  ].join('\n');
}
