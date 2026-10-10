# JobSmith

**Would you hire an AI for this support role?**

JobSmith starts from a public support job listing, identifies one repeatable task with a quote from the listing, builds a bounded AI workflow for that task, and puts it through practice and unseen synthetic cases. It ends with a clear recommendation for a **supervised sandbox pilot** or **no-go**.

No customer inbox is connected. JobSmith never sends a reply, changes an account, or uses real customer records.

## The user flow

1. Discover support openings through CrustData, or choose a clearly labeled bundled sample if CrustData is unavailable.
2. Select one role. Qwen extracts a repeatable duty and must cite an exact line from the listing.
3. Qwen designs a narrow workflow that may prepare unsent drafts or recommend human review. It cannot take account actions.
4. Evaluate the workflow on role-family practice cases. The workflow may be revised at most twice using practice results.
5. Evaluate the final workflow on a separate held-out set. A live-model run on a live listing can become a supervised pilot candidate only if every held-out check passes. Sample runs always remain previews.
6. Review the evidence, safety boundaries, and an editable, assumption-labeled capacity estimate.

The synthetic suite has eight practice cases and eight held-out cases across billing, account access, security, and workspace membership. The workflow evaluates only the task family supported by the selected role duty. Passing synthetic checks is a small signal, not a production accuracy claim.

## What each platform does

| Platform | Job in JobSmith |
| --- | --- |
| CrustData | Finds public support-role listings and source links. |
| GMI Cloud | Runs `Qwen/Qwen3.8-Max` for role-duty extraction, workflow design, revisions, and ticket decisions. |
| Neatlogs | Captures the role-to-decision trace, including model and evaluation steps. |
| Entire | Records the code evolution in the Git workflow. It is not a runtime dependency. |
| cfo.ai | Holds the separate operating and customer-pilot planning scenarios. It is not connected to the app's runtime economics estimate. |

## Run locally

Requirements: Node.js 22+ and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
# Add service keys locally. Never commit .env.local.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app creates `data/jobsmith.sqlite` on first use. Without a GMI Cloud key, JobSmith uses deterministic sample rules; the result is visibly labeled **Sample preview** and cannot qualify as a pilot candidate. Without CrustData, the role cards are visibly labeled sample listings.

## Configuration

| Variable | Used for | Default / behavior |
| --- | --- | --- |
| `GMICLOUD_API_KEY` | Live role analysis and workflow evaluation | Missing key selects the labeled sample preview. |
| `GMICLOUD_BASE_URL` | GMI Cloud OpenAI-compatible endpoint | `https://api.gmi-serving.com/v1` |
| `GMICLOUD_MODEL` | Model selection | `Qwen/Qwen3.8-Max` |
| `CRUSTDATA_API_KEY` | Live support-role discovery | Missing or unavailable API returns bundled sample listings with a warning. |
| `NEATLOGS_API_KEY` | Trace export | Optional for local use. |
| `NEATLOGS_ENDPOINT` | Trace ingestion | `https://ingest.neatlogs.com` |
| `DATABASE_PATH` | SQLite filename under `data/` | `jobsmith.sqlite` |

The cfo.ai connection is managed separately through Codex MCP. It does not require credentials in the app environment.

## Demo script

1. Start by stating: “We help a SaaS founder decide whether a real support-role task is safe enough for a supervised AI pilot.”
2. Select a live CrustData role and point to the quoted duty evidence. If using sample data, say so before starting.
3. Start probation. Show role extraction, workflow design, practice evaluation, and up to two revisions.
4. Explain the boundary: the model can prepare an unsent draft or ask for a person; it cannot touch a customer system.
5. Open the final held-out checks. Explain the pass gate and the small synthetic sample limitation.
6. Show the editable capacity estimate as an assumption-based planning aid, not a forecast.
7. In the hackathon pitch, show Neatlogs trace evidence and Entire code evolution separately. Explain cfo.ai's separate planning use without suggesting the app is linked to it.

Keep the walkthrough under three minutes. Do not imply production readiness or use real customer data.

## Architecture

```text
Next.js role-to-pilot workspace
  ├─ /api/discovery                CrustData search or labeled sample fallback
  ├─ /api/pilots                   create and list persisted pilot runs
  ├─ /api/pilots/[id]              retrieve run state and evidence
  ├─ /api/pilots/[id]/resume       continue saved role-to-pilot state machine
  ├─ pilot-agent                   structured role extraction and workflow design
  ├─ support agent                 GMI Cloud structured decisions, no answer key
  ├─ scoring                       server-side synthetic practice/held-out checks
  ├─ SQLite                        additive pilot history; prior evaluation runs remain
  └─ neatlogs                      role, workflow, model, and evaluation traces
```

The model receives the customer question, the selected bounded workflow, and relevant synthetic policy articles. It does not receive evaluator answer labels, expected article IDs, fixture practice/holdout status, or synthetic customer identities. Scores and the final gate are computed server-side. Each completed case is saved so a failed run can resume without repeating finished work.

## Development checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

The tests use synthetic data and do not require external keys.

## Submission and data boundaries

- Public code includes the Neatlogs, CrustData, and GMI Cloud application paths; no credentials are committed.
- `.env.local`, SQLite data, AWS setup notes, and Neatlogs setup notes are ignored by Git.
- Job listing text is public source material; all customer cases and policy articles are synthetic.
- cfo.ai plans and Entire activity are shown separately from the app runtime.
- No support inbox, customer database, reply delivery, or account-action integration exists.
