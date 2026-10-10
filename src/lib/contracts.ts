export type RunMode = "practice" | "evaluation";
export type Recommendation = "draft" | "escalate";
export type Category = "billing" | "access" | "security" | "account";
export type AgentMode = "gmicloud" | "sample" | "legacy" | "unavailable";

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: Category;
  body: string;
}

export interface SupportCase {
  id: string;
  name: string;
  customer: string;
  received: string;
  channel: string;
  subject: string;
  message: string;
  category: Category;
  expectedRecommendation: Recommendation;
  expectedArticleId?: string;
  severity: "low" | "normal" | "high";
  practice: boolean;
}

export interface AgentDecision {
  recommendation: Recommendation;
  category: Category;
  responseDraft: string;
  citations: string[];
  claims: { text: string; citations: string[] }[];
  confidence: number;
  rationale: string;
  mode: AgentMode;
}

export interface CaseScore {
  decisionCorrect: boolean;
  citationsValid: boolean;
  relevantEvidenceFound: boolean;
  unsupportedClaims: number;
  passed: boolean;
  latencyMs: number;
}

export interface EvaluatedCase {
  caseId: string;
  decision: AgentDecision;
  score: CaseScore;
}

export interface RunSummary {
  id: string;
  mode: RunMode;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  casesTotal: number;
  casesCompleted: number;
  passed: number;
  decisionAccuracy: number;
  evidenceCoverage: number;
  safeEscalations: number;
  unsupportedClaims: number;
  averageLatencyMs: number;
  agentMode: AgentMode;
  results: EvaluatedCase[];
}

export interface RoleSignal {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  url?: string;
  description: string;
  source: "crustdata" | "sample";
}

export type PilotStatus = "queued" | "running" | "completed" | "blocked" | "failed";
export type PilotPhase = "role_analysis" | "workflow_design" | "practice" | "revision" | "holdout" | "report";

export interface RoleDuty {
  title: string;
  category: Category;
  evidenceQuote: string;
  repeatability: "high" | "medium";
  reason: string;
}

export interface BoundedWorkflow {
  name: string;
  category: Category;
  purpose: string;
  steps: string[];
  humanReviewTriggers: string[];
  excludedActions: string[];
  version: number;
}

export interface PracticeRound {
  version: number;
  results: EvaluatedCase[];
  summary: string;
}

export interface PilotRun {
  id: string;
  status: PilotStatus;
  phase: PilotPhase;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  role: RoleSignal;
  executionMode: "gmicloud" | "sample";
  duties: RoleDuty[];
  selectedDuty?: RoleDuty;
  workflow?: BoundedWorkflow;
  practiceRounds: PracticeRound[];
  holdoutResults: EvaluatedCase[];
  revisionCount: number;
  recommendation?: "pilot_candidate" | "no_go" | "preview_only";
  recommendationReason?: string;
  blockedReason?: string;
  sourceWarning?: string;
}
