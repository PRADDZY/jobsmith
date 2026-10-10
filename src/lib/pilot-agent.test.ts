import { describe, expect, it } from "vitest";
import { designWorkflow } from "./pilot-agent";
import type { RoleDuty, RoleSignal } from "./contracts";

const role: RoleSignal = {
  id: "sample-role",
  title: "Technical Support Specialist",
  company: "Sample Co",
  location: "Remote",
  postedAt: "Today",
  description: "Help customers recover access and resolve common support questions.",
  source: "sample",
};

const duty: RoleDuty = {
  title: "Guide customers through account access recovery",
  category: "access",
  evidenceQuote: "Help customers recover access",
  repeatability: "high",
  reason: "The listing names a recurring support task.",
};

describe("bounded access workflow", () => {
  it("escalates on concrete recovery risks without treating every access case as unsafe", async () => {
    const workflow = await designWorkflow(role, duty, 1, undefined, "sample");

    expect(workflow.humanReviewTriggers).toContain(
      "The verified recovery flow is unavailable, identity cannot be verified, or the customer shares or offers credentials or recovery codes.",
    );
    expect(workflow.humanReviewTriggers).not.toContain(
      "The request involves account access, security, or a change that needs verification.",
    );
    expect(workflow.excludedActions).toContain("Disable security controls or handle passwords and recovery codes.");
  });
});
