import { describe, expect, it } from "vitest";
import { knowledgeBase, supportCases } from "./fixtures";
import { scoreDecision } from "./scoring";
import type { AgentDecision } from "./contracts";
import { selectPreviewArticle } from "./policy-routing";

const testCase = supportCases.find((item) => item.id === "T-1042")!;
const source = knowledgeBase.find((article) => article.id === testCase.expectedArticleId)!;

function decision(overrides: Partial<AgentDecision> = {}): AgentDecision {
  return {
    recommendation: "draft",
    category: "billing",
    responseDraft: "You can cancel the renewal in Settings → Plan.",
    citations: [source.id],
    claims: [{ text: "The renewal can be cancelled in plan settings.", citations: [source.id] }],
    confidence: 0.9,
    rationale: "The request matches a documented billing workflow.",
    mode: "rules-preview",
    ...overrides,
  };
}

describe("scoreDecision", () => {
  it("passes a matching disposition with a relevant supplied citation", () => {
    expect(scoreDecision(testCase, decision(), [source], 12).passed).toBe(true);
  });

  it("rejects a decision whose category or disposition differs from the expected case", () => {
    const score = scoreDecision(testCase, decision({ recommendation: "escalate" }), [source], 12);
    expect(score.decisionCorrect).toBe(false);
    expect(score.passed).toBe(false);
  });

  it("flags claims with no citation and citations outside the supplied evidence", () => {
    const score = scoreDecision(testCase, decision({
      citations: [source.id, "KB-999"],
      claims: [{ text: "Unsupported assertion.", citations: [] }],
    }), [source], 12);
    expect(score.citationsValid).toBe(false);
    expect(score.unsupportedClaims).toBe(1);
    expect(score.passed).toBe(false);
  });

  it("requires the case's relevant article even when every cited ID is valid", () => {
    const otherArticle = knowledgeBase.find((article) => article.id === "KB-102")!;
    const score = scoreDecision(testCase, decision({ citations: [otherArticle.id], claims: [] }), [source, otherArticle], 12);
    expect(score.citationsValid).toBe(true);
    expect(score.relevantEvidenceFound).toBe(false);
    expect(score.passed).toBe(false);
  });
});

describe("selectPreviewArticle", () => {
  it("routes refund and renewal cases to the refund policy", () => {
    const refundCase = supportCases.find((item) => item.id === "T-1042")!;
    const articles = knowledgeBase.filter((article) => article.category === "billing");
    expect(selectPreviewArticle(refundCase, articles)?.id).toBe("KB-101");
  });

  it("routes invoice and tax cases to the invoice policy", () => {
    const invoiceCase = supportCases.find((item) => item.id === "T-1081")!;
    const articles = knowledgeBase.filter((article) => article.category === "billing");
    expect(selectPreviewArticle(invoiceCase, articles)?.id).toBe("KB-102");
  });

  it("routes authentication recovery cases to the 2FA policy", () => {
    const recoveryCase = supportCases.find((item) => item.id === "T-1082")!;
    const articles = knowledgeBase.filter((article) => article.category === "access");
    expect(selectPreviewArticle(recoveryCase, articles)?.id).toBe("KB-202");
  });
});
