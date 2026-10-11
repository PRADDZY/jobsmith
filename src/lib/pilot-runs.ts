import "server-only";
import { setTraceOutput, trace } from "neatlogs";
import type { AgentDecision, BoundedWorkflow, EvaluatedCase, PilotRun, PracticeRound, SupportCase } from "./contracts";
import { knowledgeBase, supportCases } from "./fixtures";
import { ensureObservability } from "./observability";
import { decideSupportCase } from "./agent";
import { designWorkflow, extractRoleDuties } from "./pilot-agent";
import { scoreDecision } from "./scoring";
import { getPilot, savePilot } from "./store";

const runtime = globalThis as typeof globalThis & { activePilotRuns?: Set<string> };
const activeRuns = runtime.activePilotRuns ?? (runtime.activePilotRuns = new Set());
const maximumRevisions = 2;

function update(pilot: PilotRun): void {
  savePilot(pilot);
}

function blocked(pilot: PilotRun, reason: string): void {
  pilot.status = "blocked";
  pilot.phase = "report";
  pilot.blockedReason = reason;
  pilot.recommendation = "no_go";
  pilot.recommendationReason = reason;
  pilot.completedAt = new Date().toISOString();
  update(pilot);
}

async function evaluateCase(pilot: PilotRun, testCase: SupportCase): Promise<EvaluatedCase> {
  const duty = pilot.selectedDuty!;
  const evidence = knowledgeBase.filter((article) => article.category === duty.category);
  const started = Date.now();
  let decision: AgentDecision;
  try {
    decision = await trace({
      name: "jobsmith.pilot-case",
      input: { ticketId: testCase.id, subject: testCase.subject, message: testCase.message },
      attributes: { pilot_id: pilot.id, ticket_id: testCase.id, workflow_version: pilot.workflow!.version },
    }, () => decideSupportCase(testCase, evidence, pilot.workflow, pilot.executionMode));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The model request failed.";
    throw new Error(`Could not evaluate synthetic case ${testCase.id}: ${message}`);
  }
  return {
    caseId: testCase.id,
    decision,
    score: scoreDecision(testCase, decision, evidence, Date.now() - started),
  };
}

function practiceSummary(round: PracticeRound, total: number): string {
  const passed = round.results.filter((result) => result.score.passed).length;
  const citations = round.results.every((result) => result.score.citationsValid && result.score.relevantEvidenceFound);
  const unsupported = round.results.reduce((sum, result) => sum + result.score.unsupportedClaims, 0);
  return `${passed}/${total} practice cases passed; ${citations ? "policy evidence complete" : "policy evidence gaps remain"}; ${unsupported} unsupported citation claims.`;
}

function isRoundPassing(round: PracticeRound, expectedCount: number): boolean {
  return round.results.length === expectedCount && round.results.every((result) => result.score.passed);
}

export async function resumePilot(id: string): Promise<void> {
  if (activeRuns.has(id)) return;
  const found = getPilot(id);
  if (!found) throw new Error("Pilot run was not found.");
  if (found.status === "completed" || found.status === "blocked") return;

  activeRuns.add(id);
  const pilot = found;
  pilot.status = "running";
  pilot.blockedReason = undefined;
  update(pilot);

  try {
    await ensureObservability();
    await trace({
      name: "jobsmith.role-to-pilot",
      sessionId: pilot.id,
      sessionFeatureName: "role-to-ai-coworker-probation",
      sessionEntryPoint: "support-role-card",
      input: { roleId: pilot.role.id, title: pilot.role.title, company: pilot.role.company, listingSource: pilot.role.source },
      attributes: { pilot_id: pilot.id, listing_source: pilot.role.source, execution_mode: pilot.executionMode },
    }, async () => {
      if (!pilot.selectedDuty) {
        pilot.phase = "role_analysis";
        update(pilot);
        pilot.duties = await trace({
          name: "jobsmith.extract-role-duties",
          input: { title: pilot.role.title, description: pilot.role.description.slice(0, 7000) },
          attributes: { pilot_id: pilot.id },
        }, () => extractRoleDuties(pilot.role, pilot.executionMode));
        pilot.selectedDuty = pilot.duties[0];
        update(pilot);
        if (!pilot.selectedDuty) {
          blocked(pilot, "This listing did not contain a verifiable duty in the supported demo families: billing, account access, security, or workspace membership.");
          setTraceOutput({ status: "blocked", reason: pilot.recommendationReason });
          return;
        }
      }

      if (!pilot.workflow) {
        pilot.phase = "workflow_design";
        update(pilot);
        pilot.workflow = await trace({
          name: "jobsmith.design-bounded-workflow",
          input: { roleTitle: pilot.role.title, duty: pilot.selectedDuty },
          attributes: { pilot_id: pilot.id, task_family: pilot.selectedDuty.category },
        }, () => designWorkflow(pilot.role, pilot.selectedDuty!, 1, undefined, pilot.executionMode));
        update(pilot);
      }
      if (!pilot.workflow) throw new Error("The bounded workflow could not be prepared.");

      const practiceCases = supportCases.filter((item) => item.category === pilot.selectedDuty!.category && item.practice);
      const holdoutCases = supportCases.filter((item) => item.category === pilot.selectedDuty!.category && !item.practice);
      if (practiceCases.length < 1 || holdoutCases.length < 2) {
        blocked(pilot, "There are not enough synthetic practice and held-out examples for this task family.");
        setTraceOutput({ status: "blocked", reason: pilot.recommendationReason });
        return;
      }

      let finalPracticeRound: PracticeRound | undefined;
      while (true) {
        pilot.phase = "practice";
        pilot.status = "running";
        let round = pilot.practiceRounds.find((item) => item.version === pilot.workflow!.version);
        if (!round) {
          round = { version: pilot.workflow!.version, results: [], summary: "Practice evaluation in progress." };
          pilot.practiceRounds.push(round);
        }
        update(pilot);
        for (const testCase of practiceCases) {
          if (round.results.some((result) => result.caseId === testCase.id)) continue;
          const result = await evaluateCase(pilot, testCase);
          round.results.push(result);
          round.summary = practiceSummary(round, practiceCases.length);
          update(pilot);
        }
        round.summary = practiceSummary(round, practiceCases.length);
        finalPracticeRound = round;
        update(pilot);

        if (isRoundPassing(round, practiceCases.length) || pilot.revisionCount >= maximumRevisions) break;

        pilot.phase = "revision";
        update(pilot);
        const workflowBeforeRevision = pilot.workflow;
        if (!workflowBeforeRevision) throw new Error("The bounded workflow was lost before revision.");
        const nextVersion: number = workflowBeforeRevision.version + 1;
        const revised: BoundedWorkflow = await trace({
          name: "jobsmith.revise-workflow",
          input: { workflow: workflowBeforeRevision, practiceSummary: round.summary },
          attributes: { pilot_id: pilot.id, revision: pilot.revisionCount + 1 },
        }, () => designWorkflow(pilot.role, pilot.selectedDuty!, nextVersion, { workflow: workflowBeforeRevision, practice: round! }, pilot.executionMode));
        pilot.workflow = revised;
        pilot.revisionCount += 1;
        update(pilot);
      }

      pilot.phase = "holdout";
      update(pilot);
      for (const testCase of holdoutCases) {
        if (pilot.holdoutResults.some((result) => result.caseId === testCase.id)) continue;
        const result = await evaluateCase(pilot, testCase);
        pilot.holdoutResults.push(result);
        update(pilot);
      }

      pilot.phase = "report";
      pilot.status = "completed";
      pilot.completedAt = new Date().toISOString();
      const holdoutPasses = pilot.holdoutResults.length === holdoutCases.length
        && pilot.holdoutResults.every((result) => result.score.passed);
      const practicePasses = finalPracticeRound !== undefined
        && isRoundPassing(finalPracticeRound, practiceCases.length);
      if (pilot.executionMode !== "litellm" || pilot.role.source !== "crustdata") {
        pilot.recommendation = "preview_only";
        pilot.recommendationReason = pilot.executionMode === "sample"
          ? "The workflow ran with deterministic sample rules. Configure LiteLLM for a live model evaluation before considering a supervised pilot."
          : pilot.executionMode === "gmicloud"
            ? "This saved run used the legacy GMI Cloud provider. Start a new LiteLLM run before considering a supervised pilot."
            : "This run used a bundled sample listing. Select a live CrustData listing before considering a supervised pilot.";
      } else if (practicePasses && holdoutPasses) {
        pilot.recommendation = "pilot_candidate";
        pilot.recommendationReason = "The final workflow passed every practice and held-out synthetic check. Consider a supervised, no-customer-data pilot with human approval on every draft.";
      } else if (!practicePasses) {
        pilot.recommendation = "no_go";
        pilot.recommendationReason = "The workflow still missed practice checks after two revisions. Improve the workflow before any supervised pilot.";
      } else {
        pilot.recommendation = "no_go";
        pilot.recommendationReason = "The workflow missed at least one held-out safety or evidence check. Revise the policy workflow before any supervised pilot.";
      }
      update(pilot);
      setTraceOutput({
        status: pilot.status,
        recommendation: pilot.recommendation,
        taskFamily: pilot.selectedDuty.category,
        practicePassed: finalPracticeRound?.results.filter((result) => result.score.passed).length ?? 0,
        practiceTotal: practiceCases.length,
        holdoutPassed: pilot.holdoutResults.filter((result) => result.score.passed).length,
        holdoutTotal: holdoutCases.length,
        revisions: pilot.revisionCount,
      });
    });
  } catch (error) {
    const current = getPilot(id);
    if (current) {
      current.status = "failed";
      const message = error instanceof Error ? error.message : "The pilot run stopped unexpectedly.";
        current.blockedReason = /unauthorized|\b401\b/i.test(message)
          ? current.executionMode === "gmicloud"
            ? "GMI Cloud rejected the key used by this saved run. Check its legacy GMICLOUD_API_KEY, or start a new run with LiteLLM."
            : "LiteLLM rejected the configured key. Check LITELLM_API_KEY in .env.local, restart the app, then resume this saved run or choose the labeled sample preview."
          : message;
      update(current);
    }
    throw error;
  } finally {
    activeRuns.delete(id);
  }
}
