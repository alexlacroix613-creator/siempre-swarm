/**
 * Research & Development Pipeline — Context-isolated research.
 *
 * CRITICAL: Siempre business research and tech/startup research
 * must NEVER bleed into each other. Each researcher has its own
 * memory namespace. Cross-pollination only through the R&D Director.
 *
 * Pipeline:
 *   1. CLASSIFY — Is this Siempre research, tech research, or industry research?
 *   2. ISOLATE — Route to the correct researcher (hard namespace boundary)
 *   3. RESEARCH — Agent investigates (web search, data analysis)
 *   4. SYNTHESIZE — R&D Director synthesizes if multiple contexts needed
 *   5. OPUS_REVIEW — I check for context bleed-through and accuracy
 *   6. BRIEF — Deliver findings clearly labeled by context
 */

export const RESEARCH_PIPELINE_STAGES = [
  'classify',    // What kind of research? Hard boundary decision.
  'isolate',     // Route to correct namespace
  'research',    // Agent investigates
  'synthesize',  // Director combines if needed (with explicit labeling)
  'opus_review', // Check for context bleed-through
  'brief',       // Deliver with clear context labels
] as const;

export type ResearchPipelineStage = typeof RESEARCH_PIPELINE_STAGES[number];

export type ResearchContext = 'siempre' | 'tech' | 'industry';

export function classifyResearchContext(prompt: string): ResearchContext {
  const lower = prompt.toLowerCase();

  // Tech/startup signals
  if (lower.includes('combobulator') || lower.includes('fieldkit') || lower.includes('reviewshield') ||
      lower.includes('saas') || lower.includes('startup') || lower.includes('app') ||
      lower.includes('software') || lower.includes('ai tool') || lower.includes('gawd'))
    return 'tech';

  // Siempre business signals
  if (lower.includes('siempre') || lower.includes('tequila') || lower.includes('spirits') ||
      lower.includes('distributor') || lower.includes('depletion') || lower.includes('competitor') ||
      lower.includes('brand') || lower.includes('retail'))
    return 'siempre';

  // Industry-wide
  return 'industry';
}

export function buildResearchReviewPrompt(
  context: ResearchContext,
  agentOutput: string,
  originalPrompt: string
): string {
  return [
    `## Research Review (Context: ${context.toUpperCase()})`,
    ``,
    `**Original Request:** ${originalPrompt}`,
    `**Assigned Context:** ${context}`,
    ``,
    `**Agent Findings:**`,
    agentOutput,
    ``,
    `## Research-Specific Review Checklist`,
    ``,
    `### 1. CONTEXT ISOLATION — CRITICAL`,
    `Does ANY part of this output reference the wrong context?`,
    `- If context is "siempre": NO tech/startup references should appear`,
    `- If context is "tech": NO Siempre/tequila business references should appear`,
    `- If context is "industry": General trends only, not company-specific`,
    `Flag ANY bleed-through immediately.`,
    ``,
    `### 2. SOURCE QUALITY`,
    `- Are sources cited?`,
    `- Are they recent and credible?`,
    `- Is the agent working from real data or training knowledge?`,
    `- Flag any claims that need independent verification`,
    ``,
    `### 3. ACTIONABILITY`,
    `- Is there a clear "so what" for Alex?`,
    `- Are recommendations specific enough to act on?`,
    `- Does this inform a decision Alex is currently facing?`,
    ``,
    `### 4. COMPLETENESS`,
    `- Did the research cover the question fully?`,
    `- Are there obvious angles the agent missed?`,
    `- Would Alex ask a follow-up that we should preempt?`,
    ``,
    `**Recommendation:** APPROVE | ANNOTATE | REVISE | REDO`,
  ].join('\n');
}
