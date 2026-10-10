# JobSmith

**Would you hire an AI for this support role?**

JobSmith takes a public support job listing, identifies one repeatable duty, and tests a policy-bounded AI coworker on synthetic cases before a team considers a supervised pilot. It returns a clear pilot-candidate or no-go recommendation with the role evidence, policy references, test results, and a traceable agent path.

No customer inbox is connected. JobSmith never sends a reply, changes an account, or uses real customer records.

## How it works

1. Find public support openings through CrustData, or use a visibly labeled sample listing.
2. LiteLLM routes Claude Haiku to extract one repeatable duty and quote the source listing.
3. JobSmith designs a narrow workflow with explicit human-review triggers and actions the coworker is never allowed to take.
4. Evaluate on the selected duty family's synthetic practice cases. The workflow can be revised up to twice from practice results.
5. Run the final workflow on a separate held-out set. A new live-model run on a live CrustData listing can be a supervised-pilot candidate only when every practice and held-out check passes. Sample and legacy-provider runs remain previews.
6. For each synthetic ticket, the agent calls one bounded policy-lookup tool, prepares an unsent draft or escalation, and sends the claims to an independent policy verifier. It may revise once from verifier feedback. If the revised draft still cannot be supported, it holds the case for a person.
7. Review the evidence and the illustrative capacity estimate. Open the separate editable cfo.ai operating plan for pricing, customer growth, inference and hosting costs, margins, burn, and runway.

The fixture suite contains eight practice and eight held-out cases across billing, account access, security, and workspace membership. Each run uses only the cases for the selected duty family, so the per-run sample is smaller. A pass is a small synthetic signal, not a production accuracy claim.

## What each platform does

| Platform | Job in JobSmith |
| --- | --- |
| CrustData | Finds public support-role listings and source links. |
| LiteLLM | Routes Claude Haiku through an OpenAI-compatible API for duty extraction, workflow design, draft generation, and independent verification. |
| Neatlogs | Records the role-to-decision trace, including tool lookup, model steps, verification, revisions, failures, and recovery. PII redaction is enabled. |
| Entire | Captures code evolution and checkpoints in the Git workflow. It is not a runtime dependency. |
| cfo.ai | Holds a separate, editable illustrative operating plan and customer-pilot scenario. The app's quick capacity estimate is not linked to that model. |

The cfo.ai JobSmith Operating Plan is available in the connected workspace at [Open operating plan](https://app.cfo.ai/s/p_AQGSpQYkNDhjMTcyNTgtZWIxOS00MTYyLWE3ZjQtOTFhN2Q2NGJmZTgxJDY1Yzc4ZjNkLTRkNDQtNDk3ZC1hODI5LThiOTIzZTlkMmE5ZA). It includes Base and Growth cases with editable assumptions, a 12-month forecast, operating costs, gross margin, cash, burn, and runway. All values are illustrative assumptions, not observed company actuals.

## Run locally

Requirements: Node.js 22+ and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
# Add service keys locally. Never commit .env.local.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app creates `data/jobsmith.sqlite` on first use. Without a LiteLLM key, the app runs deterministic sample rules and labels the result a preview. Without CrustData, it uses clearly labeled sample listings.

## Configuration

| Variable | Used for | Default / behavior |
| --- | --- | --- |
| `LITELLM_API_KEY` | Live role analysis, workflow design, policy-grounded drafts, and verification | Missing key selects the labeled deterministic preview. |
| `LITELLM_BASE_URL` | LiteLLM OpenAI-compatible endpoint | `https://litellm.vision.aivar.app/v1` |
| `LITELLM_MODEL` | LiteLLM model alias | `claude-haiku` |
| `CRUSTDATA_API_KEY` | Live support-role discovery | Missing or unavailable API returns bundled sample listings with a warning. |
| `NEATLOGS_API_KEY` | Trace export | Optional for local use. |
| `NEATLOGS_ENDPOINT` | Trace ingestion endpoint | `https://ingest.neatlogs.com` |
| `DATABASE_PATH` | SQLite filename under `data/` | `jobsmith.sqlite` |

New runs use LiteLLM or an explicitly selected deterministic preview. Existing GMI Cloud run records remain readable; they are not selected as a fallback for new runs.

The cfo.ai connection is managed separately through the connected cfo.ai workspace. It does not require an app environment variable.

## Architecture

```text
Next.js role-to-pilot workspace
  /api/discovery                 CrustData role search or labeled sample fallback
  /api/pilots                     create and list checkpointed runs
  /api/pilots/[id]                retrieve saved progress and evidence
  /api/pilots/[id]/resume         continue a role-to-pilot state machine
  provider                        LiteLLM as the new-run provider; legacy mode is explicit
  pilot-agent                     structured duty extraction and bounded workflow design
  support agent                   one policy tool call, draft, verifier, one revision at most
  scoring                         server-side synthetic practice and held-out checks
  SQLite                          local run state; completed cases are checkpointed
  Neatlogs                        nested role, tool, model, verification, and recovery traces
```

The model receives only the ticket text, the selected bounded workflow, and the articles returned by the policy-lookup tool. It does not receive evaluator labels, expected article IDs, practice/holdout status, or synthetic customer identities. Citation IDs are checked against the retrieved policies and an independent model verifier checks whether the draft's factual claims are supported. The score and final pilot gate stay server-side.

Completed cases are saved before the next begins. A failed model call fails the run without adding an unavailable result as a completed case. Resume skips saved successful cases and retries the failed case without creating duplicates.

## Demo script (under 3 minutes)

1. **0:00-0:20:** “We help a team decide whether a real support-role duty is safe enough for an AI coworker probation test.” State that listings are public and all tickets and policies are synthetic.
2. **0:20-0:45:** Select a live CrustData opening and point to the exact quoted duty. Clearly label it if using a sample listing.
3. **0:45-1:30:** Start probation. Show the workflow, one practice result, and the unseen checks. Open a case to show policy lookup, the unsent draft, independent claim check, citation, and any single revision.
4. **1:30-1:55:** Show the gate. Explain that a pass requires the checks in this small synthetic family; it is only a supervised sandbox candidate, never production approval.
5. **1:55-2:20:** Open the Neatlogs trace and show the tool, model, verifier, and output steps. Show the Entire checkpoint for the build history.
6. **2:20-2:45:** Open the cfo.ai operating plan. Call out its editable assumptions for customers, price, model and hosting costs, margin, burn, and runway.
7. **2:45-3:00:** Close with the boundary: replies remain unsent, no account actions exist, and a human owns every next step.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

The automated tests use synthetic fixtures and do not require external keys. A live demo run uses the local LiteLLM, CrustData, and Neatlogs configuration.

## Hackathon submission checklist

- Public repository with setup instructions and no service credentials.
- Public demo video under three minutes.
- Neatlogs trace showing the role-to-decision path and a verifier or recovery step.
- Entire checkpoint/graph for this implementation.
- cfo.ai business plan with pricing, customer assumptions, revenue, inference and hosting costs, gross margin, operating burn, and runway.
- Public quote post on the official Neatlogs hackathon post using `#neatHack`; draft copy belongs in `submission/social-post-draft.md` and must be published by a team member.
- Use Neatlogs, Entire, and cfo.ai in the submitted project and demo.

## Data and repository boundaries

- Job listings are public source material; support tickets and policies are synthetic.
- No support inbox, customer database, reply delivery, or account-action integration exists.
- `.env.local`, SQLite data, AWS credentials/setup notes, Neatlogs setup notes, and local LiteLLM setup notes are not committed.
- cfo.ai planning and Entire activity are separate from runtime calculations.
