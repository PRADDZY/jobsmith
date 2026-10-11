import { describe, expect, it } from "vitest";
import { knowledgeBase, supportCases } from "./fixtures";
import { lookupPolicyArticles, publicSupportInput, verifyDecisionEvidence } from "./agent";
import type { AgentDecision } from "./contracts";

describe("publicSupportInput", () => {
  it("keeps evaluator labels and synthetic identity fields out of model context", () => {
    const testCase = supportCases[0];
    const prompt = JSON.stringify(publicSupportInput(testCase));

    expect(prompt).toContain(testCase.subject);
    expect(prompt).toContain(testCase.message);
    expect(prompt).not.toContain("expectedRecommendation");
    expect(prompt).not.toContain("expectedArticleId");
    expect(prompt).not.toContain("practice");
    expect(prompt).not.toContain("severity");
    expect(prompt).not.toContain(testCase.name);
    expect(prompt).not.toContain(testCase.customer);
  });
});

describe("bounded policy tools", () => {
  it("finds the invoice policy from a natural-language policy query", () => {
    const billingArticles = knowledgeBase.filter((article) => article.category === "billing");

    expect(lookupPolicyArticles("update tax details for next month's invoice", billingArticles).map((article) => article.id))
      .toContain("KB-102");
  });

  it("returns only articles from the tool's supplied policy family", () => {
    const billingArticles = knowledgeBase.filter((article) => article.category === "billing");
    const found = lookupPolicyArticles("workspace owner security incident", billingArticles);

    expect(found.every((article) => billingArticles.some((candidate) => candidate.id === article.id))).toBe(true);
    expect(found.length).toBeLessThanOrEqual(2);
  });

  it("rejects unknown citations and uncited claims before a draft is returned", () => {
    const decision: AgentDecision = {
      recommendation: "draft",
      category: "billing",
      responseDraft: "Update the tax details in settings.",
      citations: ["KB-999"],
      claims: [{ text: "Update tax details in settings.", citations: [] }],
      confidence: 0.7,
      rationale: "The article supports the next step.",
      mode: "litellm",
    };

    expect(verifyDecisionEvidence(decision, knowledgeBase.filter((article) => article.category === "billing"))).toEqual(
      expect.arrayContaining([expect.stringContaining("citation"), expect.stringContaining("Claim")]),
    );
  });

  it("accepts claims that cite a retrieved policy article", () => {
    const decision: AgentDecision = {
      recommendation: "draft",
      category: "billing",
      responseDraft: "You can update tax details for future invoices.",
      citations: ["KB-102"],
      claims: [{ text: "Tax details can be updated for future invoices.", citations: ["KB-102"] }],
      confidence: 0.7,
      rationale: "The cited policy describes the next step.",
      mode: "litellm",
    };

    expect(verifyDecisionEvidence(decision, knowledgeBase.filter((article) => article.category === "billing"))).toEqual([]);
  });
});
