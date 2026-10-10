import { describe, expect, it } from "vitest";
import { completedCaseIds, mergeEvaluationResult } from "./run-recovery";
import type { EvaluatedCase } from "./contracts";

function result(caseId: string, mode: EvaluatedCase["decision"]["mode"]): EvaluatedCase {
  return {
    caseId,
    decision: {
      recommendation: "escalate",
      category: "security",
      responseDraft: "Held for human review.",
      citations: [],
      claims: [],
      confidence: 0,
      rationale: "The request is held for review.",
      mode,
    },
    score: {
      decisionCorrect: false,
      citationsValid: true,
      relevantEvidenceFound: false,
      unsupportedClaims: 0,
      passed: false,
      latencyMs: 10,
    },
  };
}

describe("evaluation failure recovery", () => {
  it("does not treat an unavailable model result as a completed case", () => {
    expect(completedCaseIds([result("case-1", "unavailable"), result("case-2", "litellm")])).toEqual(new Set(["case-2"]));
  });

  it("replaces an unavailable result with its resumed result instead of duplicating the case", () => {
    const saved = [result("case-1", "unavailable")];
    const merged = mergeEvaluationResult(saved, result("case-1", "litellm"));

    expect(merged).toHaveLength(1);
    expect(merged[0].decision.mode).toBe("litellm");
  });

  it("keeps an already completed case unchanged on a repeated resume", () => {
    const saved = [result("case-1", "litellm")];
    const merged = mergeEvaluationResult(saved, result("case-1", "sample"));

    expect(merged).toHaveLength(1);
    expect(merged[0].decision.mode).toBe("litellm");
  });
});
