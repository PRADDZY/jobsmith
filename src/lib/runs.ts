import "server-only";
import { setTraceOutput, trace } from "neatlogs";
import { decideSupportCase } from "./agent";
import type { AgentDecision, EvaluatedCase } from "./contracts";
import { knowledgeBase, supportCases } from "./fixtures";
import { ensureObservability } from "./observability";
import { scoreDecision } from "./scoring";
import { appendRunResult, beginRun, completeRun, failRun, getRun } from "./store";
import { completedCaseIds } from "./run-recovery";

export async function resumeEvaluation(id: string): Promise<void> {
  const current = getRun(id);
  if (!current) throw new Error("Evaluation run was not found.");
  if (current.status === "completed") return;
  const cases = supportCases.filter((testCase) => testCase.practice === (current.mode === "practice"));
  const completed = completedCaseIds(current.results);
  beginRun(id);

  try {
    await ensureObservability();
    await trace({
      name: "jobsmith.evaluation-run",
      sessionId: id,
      sessionFeatureName: "support-workflow-evaluation",
      sessionEntryPoint: "evaluation-dashboard",
      input: { mode: current.mode, selectedCases: cases.length, previouslyCompleted: completed.size },
      attributes: { run_id: id, run_mode: current.mode },
    }, async () => {
      for (const testCase of cases) {
        if (completed.has(testCase.id)) continue;
        const evidence = knowledgeBase.filter((article) => article.category === testCase.category);
        const started = Date.now();
        const decision: AgentDecision = await trace({
          name: "jobsmith.support-case",
          input: { ticketId: testCase.id, subject: testCase.subject, message: testCase.message },
          attributes: { ticket_id: testCase.id, ticket_category: testCase.category, evidence_count: evidence.length },
        }, () => decideSupportCase(testCase, evidence));
        const evaluated: EvaluatedCase = {
          caseId: testCase.id,
          decision,
          score: scoreDecision(testCase, decision, evidence, Date.now() - started),
        };
        appendRunResult(id, evaluated);
      }
      completeRun(id);
      const finalRun = getRun(id);
      setTraceOutput({
        runId: id,
        completed: finalRun?.casesCompleted ?? 0,
        passed: finalRun?.passed ?? 0,
        evidenceCoverage: finalRun?.evidenceCoverage ?? 0,
        provider: finalRun?.agentMode ?? "sample",
      });
    });
  } catch (error) {
    failRun(id);
    throw error;
  }
}
