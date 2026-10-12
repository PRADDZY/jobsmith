# Entire Graph source search evidence

- Repository: `PRADDZY/jobsmith`, branch `build/neathack-final`
- Tool: Entire Graph, v0.4.0
- Query: “Trace how account access cases are routed, verified against policy, and resumed safely after model failure.”
- Search mode: `entire graph search --repo . --format text --top-k 5 --max-context-bytes 7000`
- Result: low-confidence warning; the top two ranks were tied. Treat as source navigation, not a conclusive dependency proof.

## Source-linked results

1. [`src/lib/verified-draft.ts`](https://github.com/PRADDZY/jobsmith/blob/build/neathack-final/src/lib/verified-draft.ts#L9-L25), `runVerifiedDraft`: generate, verify, permit one revision, then escalate unresolved issues.
2. [`src/lib/agent.ts`](https://github.com/PRADDZY/jobsmith/blob/build/neathack-final/src/lib/agent.ts#L152-L157), `decideSupportCase`: support-case decision entry point.
3. [`src/lib/model-output.ts`](https://github.com/PRADDZY/jobsmith/blob/build/neathack-final/src/lib/model-output.ts), `boundModelText`: bounded model output handling.
4. [`src/lib/pilot-runs.ts`](https://github.com/PRADDZY/jobsmith/blob/build/neathack-final/src/lib/pilot-runs.ts#L29-L49), `evaluateCase`: traces a `jobsmith.pilot-case` call, passes the case through decision logic, and scores the result.
5. [`src/lib/provider.ts`](https://github.com/PRADDZY/jobsmith/blob/build/neathack-final/src/lib/provider.ts), `resolveModelConfiguration`: provider/model configuration resolution.

This evidence supports the implementation path shown in the demo. It does not establish that every runtime trace was read back from the Neatlogs dashboard.
