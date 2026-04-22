/**
 * Quality Tracker — Measures whether the swarm is earning its keep.
 *
 * Every time Opus reviews agent work, the outcome is recorded:
 *   APPROVE — Work was good enough as-is
 *   ANNOTATE — Work was presented with notes/caveats
 *   REVISE — Opus had to fix specific issues
 *   REDO — Work was thrown out and re-done
 *
 * If a department hits 50%+ REDO rate, that's a signal to either:
 *   - Upgrade the model tier for those agents
 *   - Pull that task type back to direct Opus handling
 *
 * Stored in local SQLite under the active tenant's memory dir
 * (see src/tenant/resolver.ts).
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tenantPath } from '../tenant/resolver.js';

const DB_DIR = tenantPath('memory');
const DB_PATH = join(DB_DIR, 'quality.db');

export type ReviewOutcome = 'approve' | 'annotate' | 'revise' | 'redo';

export interface QualityRecord {
  id: string;
  taskId: string;
  department: string;
  agentId: string;
  stratum: string;
  modelUsed: string;
  modelTier: string;
  outcome: ReviewOutcome;
  issues: string[];
  timeToReview: number;
  wouldHaveBeenFaster: boolean;
  createdAt: string;
}

export interface DepartmentScore {
  department: string;
  totalReviews: number;
  approveRate: number;
  annotateRate: number;
  reviseRate: number;
  redoRate: number;
  avgReviewTime: number;
  recommendation: 'keep' | 'upgrade_tier' | 'pull_back';
}

export class QualityTracker {
  private db: InstanceType<typeof Database>;

  constructor(dbPath?: string) {
    const path = dbPath || DB_PATH;
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quality_reviews (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        department TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        stratum TEXT NOT NULL,
        model_used TEXT NOT NULL,
        model_tier TEXT NOT NULL,
        outcome TEXT NOT NULL,
        issues TEXT DEFAULT '[]',
        time_to_review INTEGER DEFAULT 0,
        would_have_been_faster INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_qr_department ON quality_reviews(department);
      CREATE INDEX IF NOT EXISTS idx_qr_agent ON quality_reviews(agent_id);
      CREATE INDEX IF NOT EXISTS idx_qr_outcome ON quality_reviews(outcome);
    `);
  }

  record(review: Omit<QualityRecord, 'id' | 'createdAt'>): string {
    const id = `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO quality_reviews
        (id, task_id, department, agent_id, stratum, model_used, model_tier, outcome, issues, time_to_review, would_have_been_faster, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, review.taskId, review.department, review.agentId, review.stratum,
      review.modelUsed, review.modelTier, review.outcome,
      JSON.stringify(review.issues), review.timeToReview,
      review.wouldHaveBeenFaster ? 1 : 0, now
    );

    return id;
  }

  departmentScores(): DepartmentScore[] {
    const rows = this.db.prepare(`
      SELECT
        department,
        COUNT(*) as total,
        SUM(CASE WHEN outcome = 'approve' THEN 1 ELSE 0 END) as approves,
        SUM(CASE WHEN outcome = 'annotate' THEN 1 ELSE 0 END) as annotates,
        SUM(CASE WHEN outcome = 'revise' THEN 1 ELSE 0 END) as revises,
        SUM(CASE WHEN outcome = 'redo' THEN 1 ELSE 0 END) as redos,
        AVG(time_to_review) as avg_review_time,
        SUM(CASE WHEN would_have_been_faster = 1 THEN 1 ELSE 0 END) as faster_count
      FROM quality_reviews
      GROUP BY department
    `).all() as any[];

    return rows.map(r => {
      const redoRate = r.redos / r.total;
      const fasterRate = r.faster_count / r.total;

      let recommendation: 'keep' | 'upgrade_tier' | 'pull_back';
      if (redoRate >= 0.5) recommendation = 'pull_back';
      else if (redoRate >= 0.25 || fasterRate >= 0.5) recommendation = 'upgrade_tier';
      else recommendation = 'keep';

      return {
        department: r.department,
        totalReviews: r.total,
        approveRate: r.approves / r.total,
        annotateRate: r.annotates / r.total,
        reviseRate: r.revises / r.total,
        redoRate,
        avgReviewTime: Math.round(r.avg_review_time),
        recommendation,
      };
    });
  }

  agentScores(): Array<{
    agentId: string;
    department: string;
    totalReviews: number;
    approveRate: number;
    redoRate: number;
    recommendation: string;
  }> {
    const rows = this.db.prepare(`
      SELECT agent_id, department, COUNT(*) as total,
        SUM(CASE WHEN outcome = 'approve' THEN 1 ELSE 0 END) as approves,
        SUM(CASE WHEN outcome = 'redo' THEN 1 ELSE 0 END) as redos
      FROM quality_reviews GROUP BY agent_id
    `).all() as any[];

    return rows.map(r => ({
      agentId: r.agent_id,
      department: r.department,
      totalReviews: r.total,
      approveRate: r.approves / r.total,
      redoRate: r.redos / r.total,
      recommendation: r.redos / r.total >= 0.5 ? 'UPGRADE or PULL BACK' :
                       r.redos / r.total >= 0.25 ? 'MONITOR' : 'OK',
    }));
  }

  formatReport(): string {
    const deptScores = this.departmentScores();
    if (deptScores.length === 0) return 'No reviews recorded yet.';

    const lines = ['SIEMPRE SWARM — Quality Report', '═'.repeat(50), ''];

    for (const d of deptScores) {
      const bar = (rate: number) => '█'.repeat(Math.round(rate * 10)) + '░'.repeat(10 - Math.round(rate * 10));
      lines.push(`${d.department.toUpperCase()} (${d.totalReviews} reviews)`);
      lines.push(`  Approve:  ${bar(d.approveRate)} ${Math.round(d.approveRate * 100)}%`);
      lines.push(`  Annotate: ${bar(d.annotateRate)} ${Math.round(d.annotateRate * 100)}%`);
      lines.push(`  Revise:   ${bar(d.reviseRate)} ${Math.round(d.reviseRate * 100)}%`);
      lines.push(`  Redo:     ${bar(d.redoRate)} ${Math.round(d.redoRate * 100)}%`);
      lines.push(`  → ${d.recommendation.toUpperCase()}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  close(): void {
    this.db.close();
  }
}
