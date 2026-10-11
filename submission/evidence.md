# Submission evidence

Do not submit until the trace links and recording are verified. Team and repository details below are current. No API keys, customer data, or evaluator labels belong here.

## Agent improvement

- Provider and model alias: LiteLLM, `claude-haiku`.
- Source role: live CrustData listing, Technical Customer Support (Arabic Speaker) at respond.io.
- Comparable task family: account access recovery. The model chose different duty titles across runs, so this is a comparable family, not a controlled same-duty A/B test.
- Before Neatlogs session ID: `88541991-5e85-444a-8566-686ea9b9670c`.
- After Neatlogs session ID: `4dc24caf-7367-44d2-a115-c153f4589575`.
- Before: final practice round 1/2; held-out 1/2; combined 2/4 passed; policy citation and relevance 4/4; unsupported citation claims 0; two revisions; final gate no-go; mean case latency 5.76 seconds.
- After: practice 2/2; held-out 2/2; combined 4/4 passed; policy citation and relevance 4/4; unsupported citation claims 0; no revision needed; supervised pilot candidate; mean case latency 6.26 seconds.
- Change: switched to provider-compatible structured output schemas while enforcing size limits locally, then narrowed access review triggers. Safe recovery guidance is drafted when no secret is offered; missing recovery or offered credentials still requires a person.
- Limits: small synthetic set (two practice and two held-out cases per run); model-selected duty titles differed; no production data or customer workflow was tested. Latency is the measured per-case end-to-end evaluation time, not a provider-only benchmark.
- Trace links: pending dashboard verification. JobSmith uses the pilot IDs above as Neatlogs session IDs; locate both by session ID and paste the public trace URLs here.

## Failure and recovery

- Neatlogs session ID: `88541991-5e85-444a-8566-686ea9b9670c`.
- Failure: provider JSON responses were Markdown-fenced, then the Bedrock-backed structured output rejected unsupported schema bounds; a later response exceeded the app's rationale limit.
- Saved checkpoint: the role, extracted duty, and bounded workflow were retained. The first practice case had not yet been scored when the run paused.
- Recovery: resumed the same saved pilot after adapting the JSON Schema and bounding model text before strict validation. The run completed with two revisions, no duplicate case IDs, and a no-go recommendation; the subsequent access-policy change produced the passing run above.
- Recovery trace URL: pending dashboard verification for the same session ID.

## Neatlogs delivery check

- SDK initialization and export flush succeeded with PII redaction enabled.
- The controlled doctor probe was accepted and reached the `raw_durable` stage, but authenticated readback still returned `202 processing` when checked. Confirm the project traces finalize in the Neatlogs dashboard before claiming public trace URLs.
- Doctor probe trace ID: `24ddb8e49e5f1a203405891d831f8852`.

## Required partner proof

- Neatlogs traces: pending dashboard verification; session IDs are listed above.
- Entire checkpoint or graph: pending Codex hook approval. `entire enable` reports enabled, but `entire status` shows seven Codex hooks need approval and `entire checkpoint list` currently shows zero checkpoints.
- Public implementation branch: [build/neathack-final](https://github.com/PRADDZY/jobsmith/tree/build/neathack-final); [PR #2](https://github.com/PRADDZY/jobsmith/pull/2) targets `main`. Its commit history shows code and evidence work dated Oct 10-11, 2026.
- cfo.ai operating plan: [Open the illustrative JobSmith plan](https://app.cfo.ai/s/p_AQKSpQYkYzc5Mjg4NDQtMzA5Yi00ZWRjLTg4ZWYtNzY5OGU2M2JlOTA0JDY1Yzc4ZjNkLTRkNDQtNDk3ZC1hODI5LThiOTIzZTlkMmE5ZA).
- Demo video (under three minutes): not recorded.
- Public repository: [PRADDZY/jobsmith](https://github.com/PRADDZY/jobsmith); the implementation branch is pushed and linked from PR #2.
- Official X quote-post: not published; the team member must post it during the submission window.

## Team and project details

- Team name: Hacktopus
- Team members: Pratik Daithankar (solo)
- Project name: JobSmith
- One-line pitch: Decide whether a real support-role task is ready for a supervised AI coworker pilot.
