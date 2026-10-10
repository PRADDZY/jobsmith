# JobSmith

**Put a support AI coworker through probation before a customer ever sees a reply.**

JobSmith starts from support-role signals, maps repeatable duties to a bounded ticket workflow, and checks that workflow against policy-linked synthetic cases. Drafts stay unsent. When a decision crosses a safety boundary, the workflow should hold it for a person.

## What works in this build

- A support-workflow desk with a CrustData role-discovery action and clearly labeled sample listings when no key is configured.
- A practice inbox with eight synthetic tickets and six synthetic policy articles.
- A separate four-case held-out evaluation set.
- OpenRouter structured decisions through the Vercel AI SDK, with Neatlogs spans around model calls and workflow steps.
- An offline rules preview when no OpenRouter key is configured. The UI labels this mode and does not present it as a live model evaluation.
- SQLite run records that save completed cases as they finish and allow an interrupted run to resume.
- An editable pilot-economics scenario. Values are assumptions, not a forecast.

The held-out set is small and synthetic. The scorecard is a workflow signal, not a claim about production accuracy. The “unsupported claims” check only verifies that declared claims cite an article supplied to the model; it does not prove semantic truth.

## Run locally

Requirements: Node.js 22+ and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
# Add the service keys to .env.local locally; never commit that file.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The project runs without service keys in **Rules preview · offline** mode. SQLite creates `data/jobsmith.sqlite` on the first run.

## Local configuration

| Variable | Required for | Notes |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Live model decisions | Leave blank for the labeled rules preview. |
| `OPENROUTER_MODEL` | Live model decisions | Defaults to `openai/gpt-4.1-mini`. |
| `CRUSTDATA_API_KEY` | Live role discovery | Without it, the screen uses illustrative sample roles. |
| `NEATLOGS_API_KEY` | Trace export | Optional locally; the SDK initializes once with the server process. |
| `NEATLOGS_ENDPOINT` | Trace export | Defaults to `https://ingest.neatlogs.com`. |
| `DATABASE_PATH` | Run storage | Defaults to `./data/jobsmith.sqlite`. Keep this on persistent disk for deployment. |

The cfo.ai connection is managed by Codex through MCP; no cfo.ai OAuth credentials belong in the app's `.env.local`.

## Use the demo

1. In **Overview**, point out that all tickets, customers, and policies are synthetic, then start **Test 4 held-out cases**.
2. Show the progress indicator and resulting decision match, evidence coverage, and safe escalation counts.
3. Open **Run evidence** to inspect case-level decisions and trace context.
4. Open **Workflow lab** to compare a draft with its source article and explain the human-review boundary.
5. Open **Hiring signals**. If CrustData is not configured, the screen explicitly labels the examples as samples; with a key, refresh to load indexed public roles and source links.
6. Change the pilot-economics assumptions and describe the result as an editable scenario rather than a forecast.
7. For the cfo.ai sponsor demo, open the private **JobSmith Customer Pilot** and **JobSmith Operating Plan** pages and show their separate, assumption-labeled scenarios.

For a short capture, record the browser at 1440×900, start on Overview, and keep the browser console hidden. Capture one full held-out run, then show the evidence ledger and a source article. A 2–3 minute walkthrough is enough; do not imply that a customer inbox or production company data is connected.

## Architecture

```text
Next.js dashboard
  ├─ /api/discovery ── CrustData job search (or labeled local samples)
  ├─ /api/runs ─────── SQLite run creation and history
  ├─ /api/runs/[id] ── progress and saved case decisions
  ├─ /api/runs/[id]/resume ─ resumable evaluation execution
  └─ support evaluator ─ OpenRouter + AI SDK + Zod, or explicit rules preview
                              └─ neatlogs root/case/model spans
```

The AI may only recommend an unsent draft or escalation. Ticket text is treated as untrusted. The model receives only the category-matched synthetic policy articles; each decision is schema-validated, checked for known source IDs, scored against the held-out expectation, and saved as a case completes. On interruption, completed cases remain in SQLite and the run endpoint can resume the rest.

## Development checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

The integration tests use no real customer data or external credentials.

## Current integration boundary

CrustData, OpenRouter, and Neatlogs have application paths in this build. cfo.ai is connected separately through Codex MCP, with an illustrative customer-pilot scenario and a separate JobSmith operating-plan scenario in the private workspace. The app's editable economics panel is local-only and is not live-linked to those CFO models.

## Security and data

- `.env.local`, the SQLite database, AWS setup notes, and Neatlogs setup notes are excluded from Git.
- Customer names, tickets, and policy articles in the demo are synthetic.
- No support inbox is connected; no reply or account action is sent.
- Keep deployment on persistent storage because SQLite runs are local process data.
