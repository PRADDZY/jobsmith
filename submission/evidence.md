# Submission evidence

Project: **JobSmith** · Team: **Hacktopus** · Builder: **Pratik Daithankar**

## Agent improvement

- Provider/model alias: LiteLLM, `claude-haiku`.
- Source role: live CrustData listing, Technical Customer Support (Arabic Speaker) at respond.io.
- Task family: account-access recovery. The selected duty titles differed across runs, so this is directional evidence rather than a controlled same-duty comparison.
- Before session: `88541991-5e85-444a-8566-686ea9b9670c`.
- After session: `4dc24caf-7367-44d2-a115-c153f4589575`.
- Before: practice 1/2, held-out 1/2, combined 2/4; policy citation and relevance 4/4; unsupported citation claims 0; two revisions; final gate no-go; mean case latency 5.76 seconds.
- After: practice 2/2, held-out 2/2, combined 4/4; policy citation and relevance 4/4; unsupported citation claims 0; no revision needed; supervised pilot candidate; mean case latency 6.26 seconds.
- Change: switched to provider-compatible structured output schemas while enforcing size limits locally, then narrowed access-review triggers. Safe recovery guidance is drafted when no secret is offered; missing identity/recovery details or offered credentials are escalated to a person.
- Limits: two practice and two held-out synthetic cases per run; selected duty titles differed; no production data or customer workflow was tested. Latency is end-to-end case evaluation time, not a provider-only benchmark.

## Failure and recovery

- The first run encountered Markdown-fenced provider JSON, an unsupported schema bound, and a response exceeding the app's rationale limit.
- The saved role, extracted duty, and bounded workflow were retained. The run resumed after adapting the schema and bounding model text before strict validation.
- The resumed run completed without duplicate case IDs, but remained no-go. A later access-policy change produced the 4/4 supervised-pilot candidate.

## Neatlogs

- SDK initialization and export flush succeeded with PII redaction enabled.
- The controlled doctor probe was accepted and reached `raw_durable`; authenticated readback returned `202 processing` when checked.
- Both pilot session IDs still need dashboard verification. No public trace links are claimed until those sessions are finalized and the links are opened successfully.
- The app's `NEATLOGS_API_KEY` is an ingestion credential. Neatlogs says ingestion credentials do not authorize Public API reads; trace readback uses dashboard/CLI OAuth or a service-account token. See [Neatlogs authentication](https://docs.neatlogs.com/api-reference/authentication) and the [CLI guide](https://docs.neatlogs.com/cli). No token is included here or in Git.
- Doctor probe trace ID: `24ddb8e49e5f1a203405891d831f8852`.

## Entire

- `entire status` reports Entire enabled on `build/neathack-final`, with Codex hooks active and approval records present.
- A real Entire Graph search was run against the implementation. The query and source-linked results are recorded in [`entire-graph-proof.md`](entire-graph-proof.md).
- The graph search warned that the top result ranking was low confidence and tied; use it as code-navigation evidence, not as a conclusive dependency proof. No checkpoint was created in this session.

## cfo.ai

- Editable operating plan: [JobSmith Operating Plan (Illustrative)](https://app.cfo.ai/s/p_AQKSpQYkYzc5Mjg4NDQtMzA5Yi00ZWRjLTg4ZWYtNzY5OGU2M2JlOTA0JDY1Yzc4ZjNkLTRkNDQtNDk3ZC1hODI5LThiOTIzZTlkMmE5ZA).
- The plan labels itself illustrative, not actuals or a forecast. Inputs include zero opening customers, two new customers per month, 3% monthly churn, $399 subscription per customer per month, $45 service cost per customer per month, and $6,000 fixed monthly operating costs. Replace these assumptions before using it for a business decision.

## Public project and submission

- Repository: [PRADDZY/jobsmith](https://github.com/PRADDZY/jobsmith).
- Branch: [build/neathack-final](https://github.com/PRADDZY/jobsmith/tree/build/neathack-final); PR #2 targets `main`.
- Team: Hacktopus; solo member Pratik Daithankar.
- Demo video: generated as a local MP4 in the sibling `submission-assets` folder; decoded successfully with audible AAC narration, H.264 video, and a 79.27-second duration. Attach it to the quote-post.
- Quote-post and form submission: pending the team member's account action. Follow [`checklist.md`](checklist.md); do not claim submission receipt until the event site confirms it.
