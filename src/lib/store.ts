import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { AgentMode, EvaluatedCase, RunMode, RunSummary } from "./contracts";

type RunRow = {
  id: string;
  mode: RunMode;
  status: RunSummary["status"];
  created_at: string;
  completed_at: string | null;
  cases_total: number;
  cases_completed: number;
  results_json: string;
  agent_mode: RunSummary["agentMode"];
};

const globalStore = globalThis as typeof globalThis & { jobsmithDb?: Database.Database };

function database(): Database.Database {
  if (globalStore.jobsmithDb) return globalStore.jobsmithDb;
  const filePath = join(process.cwd(), "data", basename(process.env.DATABASE_PATH || "jobsmith.sqlite"));
  mkdirSync(dirname(filePath), { recursive: true });
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS evaluation_runs (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      cases_total INTEGER NOT NULL,
      cases_completed INTEGER NOT NULL DEFAULT 0,
      results_json TEXT NOT NULL DEFAULT '[]',
      agent_mode TEXT NOT NULL DEFAULT 'sample'
    );
    CREATE INDEX IF NOT EXISTS evaluation_runs_created_at ON evaluation_runs(created_at DESC);
  `);
  globalStore.jobsmithDb = db;
  return db;
}

function toSummary(row: RunRow): RunSummary {
  const results = (JSON.parse(row.results_json) as EvaluatedCase[]).map((result) => ({
    ...result,
    decision: {
      ...result.decision,
      mode: normalizeAgentMode(result.decision.mode),
    },
  }));
  const passed = results.filter((result) => result.score.passed).length;
  const decisionCorrect = results.filter((result) => result.score.decisionCorrect).length;
  const evidenceCovered = results.filter((result) => result.score.citationsValid && result.score.relevantEvidenceFound).length;
  const safeEscalations = results.filter((result) => result.decision.recommendation === "escalate" && result.score.decisionCorrect).length;
  const unsupportedClaims = results.reduce((sum, result) => sum + result.score.unsupportedClaims, 0);
  const averageLatencyMs = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.score.latencyMs, 0) / results.length)
    : 0;

  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
    casesTotal: row.cases_total,
    casesCompleted: row.cases_completed,
    passed,
    decisionAccuracy: results.length ? Math.round((decisionCorrect / results.length) * 100) : 0,
    evidenceCoverage: results.length ? Math.round((evidenceCovered / results.length) * 100) : 0,
    safeEscalations,
    unsupportedClaims,
    averageLatencyMs,
    agentMode: normalizeAgentMode(row.agent_mode),
    results,
  };
}

function normalizeAgentMode(value: string): AgentMode {
  if (value === "gmicloud" || value === "sample" || value === "unavailable") return value;
  if (value === "openrouter" || value === "legacy") return "legacy";
  return "sample";
}

export function createRun(mode: RunMode, casesTotal: number): RunSummary {
  const row: RunRow = {
    id: randomUUID(), mode, status: "pending", created_at: new Date().toISOString(), completed_at: null,
    cases_total: casesTotal, cases_completed: 0, results_json: "[]", agent_mode: process.env.GMICLOUD_API_KEY ? "gmicloud" : "sample",
  };
  database().prepare(`INSERT INTO evaluation_runs
    (id, mode, status, created_at, cases_total, results_json, agent_mode) VALUES
    (@id, @mode, @status, @created_at, @cases_total, @results_json, @agent_mode)`).run(row);
  return toSummary(row);
}

export function getRun(id: string): RunSummary | undefined {
  const row = database().prepare("SELECT * FROM evaluation_runs WHERE id = ?").get(id) as RunRow | undefined;
  return row ? toSummary(row) : undefined;
}

export function listRuns(limit = 8): RunSummary[] {
  const rows = database().prepare("SELECT * FROM evaluation_runs ORDER BY created_at DESC LIMIT ?").all(limit) as RunRow[];
  return rows.map(toSummary);
}

export function beginRun(id: string): void {
  database().prepare("UPDATE evaluation_runs SET status = 'running' WHERE id = ? AND status IN ('pending', 'running')").run(id);
}

export function appendRunResult(id: string, result: EvaluatedCase): void {
  const db = database();
  const row = db.prepare("SELECT results_json, agent_mode FROM evaluation_runs WHERE id = ?").get(id) as Pick<RunRow, "results_json" | "agent_mode"> | undefined;
  if (!row) throw new Error("Evaluation run was not found.");
  const results = JSON.parse(row.results_json) as EvaluatedCase[];
  if (!results.some((item) => item.caseId === result.caseId)) results.push(result);
  const agentMode = results.some((item) => item.decision.mode === "gmicloud")
    ? "gmicloud"
    : results.some((item) => item.decision.mode === "legacy") ? "legacy"
      : results.some((item) => item.decision.mode === "unavailable") ? "unavailable" : "sample";
  db.prepare("UPDATE evaluation_runs SET results_json = ?, cases_completed = ?, agent_mode = ?, status = 'running' WHERE id = ?")
    .run(JSON.stringify(results), results.length, agentMode, id);
}

export function completeRun(id: string): void {
  database().prepare("UPDATE evaluation_runs SET status = 'completed', completed_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
}

export function failRun(id: string): void {
  database().prepare("UPDATE evaluation_runs SET status = 'failed', completed_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
}
