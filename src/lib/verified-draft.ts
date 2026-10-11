export type VerificationStatus = "verified" | "escalated";

export type VerifiedDraftResult<T> = {
  draft: T;
  status: VerificationStatus;
  revisions: number;
};

export async function runVerifiedDraft<T>(
  generate: (revision: number, priorIssues: string[]) => Promise<T>,
  verify: (draft: T) => Promise<string[]>,
  escalate: (draft: T, issues: string[]) => T,
): Promise<VerifiedDraftResult<T>> {
  let priorIssues: string[] = [];

  for (let revision = 0; revision <= 1; revision += 1) {
    const draft = await generate(revision, priorIssues);
    const issues = await verify(draft);
    if (issues.length === 0) return { draft, status: "verified", revisions: revision };
    if (revision === 1) return { draft: escalate(draft, issues), status: "escalated", revisions: revision };
    priorIssues = issues;
  }

  throw new Error("The bounded draft review ended unexpectedly.");
}
