import { describe, expect, it } from "vitest";
import { knowledgeBase, supportCases } from "./fixtures";
import { publicSupportInput } from "./agent";

describe("publicSupportInput", () => {
  it("keeps evaluator labels and synthetic identity fields out of model context", () => {
    const testCase = supportCases[0];
    const prompt = JSON.stringify(publicSupportInput(testCase, knowledgeBase));

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
