/**
 * Department & Agent Type Definitions — Siempre Swarm
 *
 * Defines the 6-department hierarchy with agent roles,
 * memory namespaces, and routing rules.
 */

export type DepartmentId = 'pricing' | 'sales_intel' | 'sales' | 'hunting' | 'farming' | 'research' | 'creative' | 'comms' | 'devops';

export interface Department {
  id: DepartmentId;
  name: string;
  description: string;
  containerTag: string;           // Supermemory namespace
  director: AgentRole;            // Department head
  agents: AgentRole[];            // Specialist agents
  routingKeywords: string[];      // Keywords that route tasks here
  defaultModelTier: 'free' | 'budget' | 'mid' | 'top';
}

export interface AgentRole {
  id: string;
  name: string;
  department: DepartmentId;
  containerTag: string;           // Agent-specific memory namespace
  description: string;
  capabilities: string[];
  modelTier: 'free' | 'budget' | 'mid' | 'top';
  systemPrompt: string;           // Injected when agent is spawned
}

export interface AgentTask {
  id: string;
  department: DepartmentId;
  assignedAgent: string;
  prompt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  modelUsed?: string;
  cost?: number;
  result?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DepartmentReport {
  department: DepartmentId;
  summary: string;
  completedTasks: number;
  pendingTasks: number;
  totalCost: number;
  updatedAt: string;
}

/**
 * The Executive Briefing — what flows up to the orchestrator.
 * This is the "master document" Alex described.
 */
export interface ExecutiveBriefing {
  generatedAt: string;
  departments: DepartmentReport[];
  alerts: string[];               // Urgent items requiring attention
  decisions: string[];            // Decisions waiting for Alex
  totalCostToday: number;
  tokensSavedByRouting: number;
}
