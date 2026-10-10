import type { AgentDecision, CaseScore, KnowledgeArticle, SupportCase } from "./contracts";

export function scoreDecision(
  testCase: SupportCase,
  decision: AgentDecision,
  evidence: KnowledgeArticle[],
  latencyMs: number,
): CaseScore {
  const evidenceIds = new Set(evidence.map((article) => article.id));
  const citationsValid = decision.citations.every((id) => evidenceIds.has(id))
    && decision.claims.every((claim) => claim.citations.every((id) => evidenceIds.has(id)));
  const relevantEvidenceFound = testCase.expectedArticleId
    ? decision.citations.includes(testCase.expectedArticleId)
      || decision.claims.some((claim) => claim.citations.includes(testCase.expectedArticleId!))
    : decision.citations.length > 0;
  const unsupportedClaims = decision.claims.filter((claim) =>
    claim.citations.length === 0 || claim.citations.some((id) => !evidenceIds.has(id)),
  ).length;
  const decisionCorrect = decision.recommendation === testCase.expectedRecommendation
    && decision.category === testCase.category;

  return {
    decisionCorrect,
    citationsValid,
    relevantEvidenceFound,
    unsupportedClaims,
    passed: decisionCorrect && citationsValid && relevantEvidenceFound && unsupportedClaims === 0,
    latencyMs,
  };
}
