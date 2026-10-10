import type { EvaluatedCase } from "./contracts";

export function completedCaseIds(results: EvaluatedCase[]): Set<string> {
  return new Set(results.filter((result) => result.decision.mode !== "unavailable").map((result) => result.caseId));
}

export function mergeEvaluationResult(results: EvaluatedCase[], incoming: EvaluatedCase): EvaluatedCase[] {
  const index = results.findIndex((result) => result.caseId === incoming.caseId);
  if (index < 0) return [...results, incoming];
  if (results[index].decision.mode !== "unavailable" || incoming.decision.mode === "unavailable") return results;
  return results.map((result, resultIndex) => resultIndex === index ? incoming : result);
}
