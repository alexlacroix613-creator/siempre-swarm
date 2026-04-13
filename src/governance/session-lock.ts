/**
 * Session Lock — Prevents parallel agents from clobbering each other.
 *
 * Implements file-level write guards, branch isolation detection,
 * and port conflict prevention. This is foundational governance
 * that runs before any agent touches the filesystem.
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';

const LOCK_DIR = '.siempre-swarm/locks';

export interface SessionLock {
  sessionId: string;
  agentId: string;
  department: string;
  lockedFiles: string[];
  lockedPorts: number[];
  branch: string;
  pid: number;
  createdAt: string;
  expiresAt: string;
}

export interface LockResult {
  acquired: boolean;
  conflict?: {
    holder: SessionLock;
    reason: string;
  };
}

/**
 * Acquire a write lock on specific files for an agent.
 * Prevents two agents from editing the same file simultaneously.
 */
export function acquireFileLock(
  projectDir: string,
  agentId: string,
  department: string,
  files: string[]
): LockResult {
  const lockDir = join(projectDir, LOCK_DIR);
  mkdirSync(lockDir, { recursive: true });

  // Check for existing locks on these files
  const existingLocks = getActiveLocks(lockDir);
  for (const lock of existingLocks) {
    if (new Date(lock.expiresAt) < new Date()) {
      releaseLock(lockDir, lock.sessionId);
      continue;
    }
    if (lock.agentId === agentId) continue;

    const conflicting = files.filter(f => lock.lockedFiles.includes(f));
    if (conflicting.length > 0) {
      return {
        acquired: false,
        conflict: {
          holder: lock,
          reason: `Files locked by ${lock.agentId} (${lock.department}): ${conflicting.join(', ')}`,
        },
      };
    }
  }

  const sessionId = `session-${Date.now()}-${agentId}`;
  const lock: SessionLock = {
    sessionId,
    agentId,
    department,
    lockedFiles: files,
    lockedPorts: [],
    branch: getCurrentBranch(projectDir),
    pid: process.pid,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30min default
  };

  writeFileSync(
    join(lockDir, `${sessionId}.json`),
    JSON.stringify(lock, null, 2)
  );

  return { acquired: true };
}

/**
 * Acquire a port lock to prevent two agents from binding the same port.
 */
export function acquirePortLock(
  projectDir: string,
  agentId: string,
  port: number
): LockResult {
  const lockDir = join(projectDir, LOCK_DIR);
  mkdirSync(lockDir, { recursive: true });

  const existingLocks = getActiveLocks(lockDir);
  for (const lock of existingLocks) {
    if (new Date(lock.expiresAt) < new Date()) {
      releaseLock(lockDir, lock.sessionId);
      continue;
    }
    if (lock.lockedPorts.includes(port)) {
      return {
        acquired: false,
        conflict: {
          holder: lock,
          reason: `Port ${port} locked by ${lock.agentId} (${lock.department})`,
        },
      };
    }
  }

  const sessionId = `port-${Date.now()}-${agentId}`;
  const lock: SessionLock = {
    sessionId,
    agentId,
    department: '',
    lockedFiles: [],
    lockedPorts: [port],
    branch: getCurrentBranch(projectDir),
    pid: process.pid,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1hr for ports
  };

  writeFileSync(
    join(lockDir, `${sessionId}.json`),
    JSON.stringify(lock, null, 2)
  );

  return { acquired: true };
}

/**
 * Check if the current branch is safe for this agent to work on.
 * Prevents two agents from committing to the same branch.
 */
export function checkBranchIsolation(
  projectDir: string,
  agentId: string
): { safe: boolean; suggestion?: string } {
  const lockDir = join(projectDir, LOCK_DIR);
  const currentBranch = getCurrentBranch(projectDir);
  const existingLocks = getActiveLocks(lockDir);

  for (const lock of existingLocks) {
    if (new Date(lock.expiresAt) < new Date()) continue;
    if (lock.agentId === agentId) continue;

    if (lock.branch === currentBranch) {
      return {
        safe: false,
        suggestion: `Branch '${currentBranch}' is in use by ${lock.agentId}. Use: git checkout -b agent/${agentId}/${Date.now()}`,
      };
    }
  }

  return { safe: true };
}

/**
 * Release all locks held by an agent.
 */
export function releaseAgentLocks(projectDir: string, agentId: string): number {
  const lockDir = join(projectDir, LOCK_DIR);
  if (!existsSync(lockDir)) return 0;

  const locks = getActiveLocks(lockDir);
  let released = 0;
  for (const lock of locks) {
    if (lock.agentId === agentId) {
      releaseLock(lockDir, lock.sessionId);
      released++;
    }
  }
  return released;
}

/**
 * Get all active locks (for monitoring/debugging).
 */
export function getActiveLocks(lockDirOrProject: string): SessionLock[] {
  const lockDir = lockDirOrProject.endsWith('/locks')
    ? lockDirOrProject
    : join(lockDirOrProject, LOCK_DIR);

  if (!existsSync(lockDir)) return [];

  const files = readdirSync(lockDir).filter(f => f.endsWith('.json'));
  const locks: SessionLock[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(lockDir, file), 'utf-8');
      locks.push(JSON.parse(content));
    } catch {
      try { unlinkSync(join(lockDir, file)); } catch {}
    }
  }

  return locks;
}

/**
 * Clean up expired locks.
 */
export function cleanExpiredLocks(projectDir: string): number {
  const lockDir = join(projectDir, LOCK_DIR);
  if (!existsSync(lockDir)) return 0;

  const locks = getActiveLocks(lockDir);
  let cleaned = 0;
  const now = new Date();

  for (const lock of locks) {
    if (new Date(lock.expiresAt) < now) {
      releaseLock(lockDir, lock.sessionId);
      cleaned++;
    }
  }

  return cleaned;
}

// --- Internal helpers ---

function releaseLock(lockDir: string, sessionId: string): void {
  const path = join(lockDir, `${sessionId}.json`);
  try { unlinkSync(path); } catch {}
}

function getCurrentBranch(projectDir: string): string {
  try {
    return execFileSync('git', ['branch', '--show-current'], {
      cwd: projectDir,
      encoding: 'utf-8',
    }).trim();
  } catch {
    return 'unknown';
  }
}
