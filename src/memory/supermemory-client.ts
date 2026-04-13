/**
 * Supermemory Client — Persistent memory layer for Siempre Swarm.
 *
 * Each department and agent gets its own containerTag namespace.
 * The orchestrator can search across all namespaces for synthesis.
 * Memories persist across sessions and conversations.
 */

const BASE_URL = 'https://api.supermemory.ai';

export interface MemoryEntry {
  content: string;
  containerTag: string;
  metadata?: Record<string, string | number | boolean | string[]>;
  customId?: string;
}

export interface SearchOptions {
  query: string;
  containerTags?: string[];
  threshold?: number;
  limit?: number;
  rerank?: boolean;
  searchMode?: 'hybrid' | 'memories';
  filters?: SearchFilter;
}

export interface SearchFilter {
  AND?: FilterCondition[];
  OR?: FilterCondition[];
}

export interface FilterCondition {
  key: string;
  value: string;
  filterType?: 'metadata' | 'string_contains' | 'numeric' | 'array_contains';
  numericOperator?: '>' | '<' | '>=' | '<=' | '=';
  negate?: boolean;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
  containerTag?: string;
}

export interface ProfileResult {
  static: string[];
  dynamic: string[];
}

/**
 * Container tag naming convention for Siempre Swarm:
 *
 * dept_pricing          — Pricing department shared memory
 * dept_sales_intel      — Sales intelligence department
 * dept_sales            — National Sales Force department (55 market agents)
 * dept_research         — R&D department
 * dept_creative         — Creative department (Thanks Tim)
 * dept_comms            — Communications department
 * dept_devops           — DevOps/Deploy department
 *
 * agent_virginia        — Virginia state pricing agent
 * agent_tennessee       — Tennessee state pricing agent
 * agent_vip_idig        — VIP iDig sales data agent
 * agent_oklahoma        — Oklahoma portal agent
 * agent_sales_ga        — Georgia market manager agent
 * agent_sales_ca        — California market manager agent
 * (... 55 market agents total, pattern: agent_sales_{state_code})
 *
 * shared_siempre        — Cross-department shared context
 * user_alex             — Alex's preferences, communication style, decisions
 * project_{name}        — Per-project context (combobulator, fieldkit, etc.)
 */

export class SupermemoryClient {
  private apiKey: string;
  private rateLimitRemaining: number = 10000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Store a memory in a specific namespace.
   */
  async addMemory(entry: MemoryEntry): Promise<{ id: string; status: string }> {
    const response = await this.request('POST', '/v3/documents', {
      content: entry.content,
      containerTag: entry.containerTag,
      metadata: entry.metadata,
      customId: entry.customId,
    });
    return response;
  }

  /**
   * Store multiple memories (batch, pace 1-2s apart per supermemory docs).
   */
  async addMemories(entries: MemoryEntry[]): Promise<Array<{ id: string; status: string }>> {
    const results = [];
    // Process in batches of 3-5 as recommended by docs
    for (let i = 0; i < entries.length; i += 3) {
      const batch = entries.slice(i, i + 3);
      const response = await this.request('POST', '/v3/documents/batch', batch);
      results.push(response);
      // Pace between batches
      if (i + 3 < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    return results;
  }

  /**
   * Search memories across one or more namespaces.
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const body: Record<string, unknown> = {
      q: options.query,
      limit: options.limit ?? 10,
      threshold: options.threshold ?? 0.6,
    };

    if (options.containerTags && options.containerTags.length === 1) {
      body.containerTag = options.containerTags[0];
    } else if (options.containerTags) {
      body.containerTags = options.containerTags;
    }

    if (options.rerank) body.rerank = true;
    if (options.searchMode) body.searchMode = options.searchMode;
    if (options.filters) body.filters = options.filters;

    const response = await this.request('POST', '/v4/search', body);
    return response.results || [];
  }

  /**
   * Get the executive briefing for a namespace.
   * Returns static (permanent) and dynamic (current) facts.
   */
  async getProfile(containerTag: string, query?: string): Promise<ProfileResult> {
    const params = new URLSearchParams({ containerTag });
    if (query) params.set('q', query);

    const response = await this.request('GET', `/v4/profile?${params}`);
    return {
      static: response.static || [],
      dynamic: response.dynamic || [],
    };
  }

  /**
   * Create direct memory entries (skip extraction pipeline).
   * Use for structured facts that don't need processing.
   */
  async createDirectMemories(
    memories: Array<{ memory: string; isStatic?: boolean; metadata?: Record<string, unknown> }>,
    containerTag: string
  ): Promise<{ created: number }> {
    const response = await this.request('POST', '/v4/memories', {
      memories: memories.map(m => ({
        ...m,
        containerTag,
      })),
    });
    return response;
  }

  /**
   * Forget a memory (soft delete — preserved but excluded from search).
   */
  async forgetMemory(memoryId: string, reason?: string): Promise<void> {
    await this.request('POST', `/v4/memories/${memoryId}/forget`, {
      reason: reason || 'Marked as stale',
    });
  }

  /**
   * Delete all data in a namespace. Use with extreme caution.
   */
  async deleteNamespace(containerTag: string): Promise<void> {
    await this.request('DELETE', `/v3/container-tags/${containerTag}`);
  }

  /**
   * Check remaining rate limit budget.
   */
  getRateLimitRemaining(): number {
    return this.rateLimitRemaining;
  }

  // --- Internal ---

  private async request(method: string, path: string, body?: unknown): Promise<any> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Track rate limits from headers
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining) this.rateLimitRemaining = parseInt(remaining, 10);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supermemory API error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

/**
 * Pre-configured namespace tags for Siempre Swarm departments.
 */
export const DEPARTMENT_TAGS = {
  pricing: 'dept_pricing',
  salesIntel: 'dept_sales_intel',
  research: 'dept_research',
  creative: 'dept_creative',
  comms: 'dept_comms',
  devops: 'dept_devops',
  shared: 'shared_siempre',
  user: 'user_alex',
} as const;

/**
 * Generate a containerTag for a state-specific pricing agent.
 */
export function pricingAgentTag(state: string): string {
  return `agent_pricing_${state.toLowerCase().replace(/\s+/g, '_')}`;
}

/**
 * Generate a containerTag for a project.
 */
export function projectTag(name: string): string {
  return `project_${name.toLowerCase().replace(/\s+/g, '_')}`;
}
