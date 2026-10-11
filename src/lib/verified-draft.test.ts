import { describe, expect, it, vi } from "vitest";
import { runVerifiedDraft } from "./verified-draft";

describe("runVerifiedDraft", () => {
  it("returns a verified first draft without spending a revision", async () => {
    const generate = vi.fn().mockResolvedValue("supported draft");

    const result = await runVerifiedDraft(generate, async () => [] , () => "escalated");

    expect(result).toEqual({ draft: "supported draft", status: "verified", revisions: 0 });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("allows one evidence-guided revision and verifies the revised draft", async () => {
    const generate = vi.fn().mockResolvedValueOnce("unsupported draft").mockResolvedValueOnce("revised draft");
    const verify = vi.fn().mockResolvedValueOnce(["The draft claims a refund was approved."]).mockResolvedValueOnce([]);

    const result = await runVerifiedDraft(generate, verify, () => "escalated");

    expect(result).toEqual({ draft: "revised draft", status: "verified", revisions: 1 });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenLastCalledWith(1, ["The draft claims a refund was approved."]);
  });

  it("escalates after one failed revision without making a third draft", async () => {
    const generate = vi.fn().mockResolvedValueOnce("unsupported draft").mockResolvedValueOnce("still unsupported");
    const verify = vi.fn().mockResolvedValue(["The draft has an unsupported claim."]);
    const escalate = vi.fn().mockReturnValue("safe hold for human review");

    const result = await runVerifiedDraft(generate, verify, escalate);

    expect(result).toEqual({ draft: "safe hold for human review", status: "escalated", revisions: 1 });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(escalate).toHaveBeenCalledWith("still unsupported", ["The draft has an unsupported claim."]);
  });
});
