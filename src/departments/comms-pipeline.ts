/**
 * Communications Pipeline — Draft → Review → Approve.
 *
 * Every external communication passes through Opus before Alex sees it.
 * HARD RULE: Nothing goes to an external party without Alex's explicit approval.
 *
 * Pipeline:
 *   1. INTAKE — Who are we writing to? What's the context? What tone?
 *   2. AUDIENCE_SELECT — Route to the right specialist (distributor/legal/PR)
 *   3. CONTEXT_PULL — Check memory for relationship history with this contact
 *   4. DRAFT — Specialist agent writes the draft
 *   5. OPUS_REVIEW — I check tone, accuracy, relationship context, potential landmines
 *   6. PRESENT — Alex reviews and decides to send, edit, or scrap
 *
 * NEVER auto-send anything. NEVER. This is non-negotiable.
 */

export const COMMS_PIPELINE_STAGES = [
  'intake',          // Who, what, why, what tone?
  'audience_select', // Route to distributor/legal/PR specialist
  'context_pull',    // Check memory for relationship history
  'draft',           // Specialist writes the draft
  'opus_review',     // Tone, accuracy, relationship context check
  'present',         // Alex reviews — ONLY Alex can authorize sending
] as const;

export type CommsPipelineStage = typeof COMMS_PIPELINE_STAGES[number];

export type CommsTaskType =
  | 'distributor_email'    // Numbers-forward, partnership language
  | 'partner_legal'        // Precise, protective
  | 'pr_media'             // Aspirational, brand voice
  | 'investor'             // Data-driven, growth narrative
  | 'internal';            // Direct, action-oriented

export function classifyCommsTask(prompt: string): CommsTaskType {
  const lower = prompt.toLowerCase();

  if (lower.includes('distributor') || lower.includes('buyer') || lower.includes('depletion') || lower.includes('fob'))
    return 'distributor_email';
  if (lower.includes('legal') || lower.includes('contract') || lower.includes('partner') || lower.includes('agreement'))
    return 'partner_legal';
  if (lower.includes('press') || lower.includes('media') || lower.includes('pr ') || lower.includes('journalist') || lower.includes('publication'))
    return 'pr_media';
  if (lower.includes('investor') || lower.includes('shareholder') || lower.includes('raise') || lower.includes('funding'))
    return 'investor';

  return 'internal';
}

export function buildCommsReviewPrompt(
  taskType: CommsTaskType,
  recipient: string,
  agentOutput: string,
  originalPrompt: string
): string {
  const toneGuide: Record<CommsTaskType, string> = {
    distributor_email: 'Professional but warm, partnership-focused, numbers-forward. Reference specific data (depletions, PODs, velocity).',
    partner_legal: 'Precise, protective of Siempre interests. Firm but not adversarial. Contract-aware language.',
    pr_media: 'Aspirational, authentic, premium craft positioning. Siempre brand voice — confident, never pretentious.',
    investor: 'Data-driven, growth narrative, transparent. Combobulator-style reporting.',
    internal: 'Direct, action-oriented, no fluff.',
  };

  return [
    `## Communications Review (${taskType})`,
    ``,
    `**To:** ${recipient}`,
    `**Expected Tone:** ${toneGuide[taskType]}`,
    `**Original Request:** ${originalPrompt}`,
    ``,
    `**Draft:**`,
    agentOutput,
    ``,
    `## Comms-Specific Review Checklist`,
    ``,
    `### 1. TONE MATCH`,
    `Does this sound like Alex writing to this specific person/group?`,
    `Would Alex actually send this? Or does it sound like AI wrote it?`,
    ``,
    `### 2. RELATIONSHIP AWARENESS`,
    `- Do we know the history with this recipient?`,
    `- Any sensitive topics to avoid?`,
    `- Is the warmth/formality level appropriate for this relationship?`,
    ``,
    `### 3. FACTUAL ACCURACY`,
    `- Are any numbers, dates, or claims verifiable?`,
    `- Does the email reference things that actually happened?`,
    `- Flag any fabricated details (the agent may invent meeting references, etc.)`,
    ``,
    `### 4. STRATEGIC ALIGNMENT`,
    `- Does this communication serve the $30MM goal?`,
    `- Could anything in this email damage a relationship?`,
    `- Is this the right time to send this?`,
    ``,
    `### 5. LANDMINE CHECK`,
    `- Anything legally sensitive?`,
    `- Anything that could be forwarded and look bad?`,
    `- Any promises being made that we can't keep?`,
    ``,
    `**REMINDER: NOTHING gets sent without Alex's explicit approval.**`,
    ``,
    `**Recommendation:** APPROVE | ANNOTATE | REVISE | REDO`,
  ].join('\n');
}
