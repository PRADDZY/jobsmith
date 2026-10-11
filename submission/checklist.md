# neatHack submission checklist

## Judge proof map

The [official neatHack page](https://neatlogs.com/hackathon) assigns 30% to the agent, 25% to use of neatlogs, Entire, and cfo.ai, 20% to the demo video, 15% to building in public, and 10% to usefulness and originality. It asks for evidence judges can check and says the video must explicitly cover each partner's role in the architecture, implementation, runtime, reasoning, and result.

| Criterion | Evidence to show |
| --- | --- |
| Agent (30%) | One complete role-to-decision run: planning, policy tool use, state, held-out checks, independent verification, failure, recovery, and the supervised go/no-go gate. |
| Partner tools (25%) | Finalized before/after Neatlogs traces; an Entire checkpoint or graph tied to the implementation; the editable cfo.ai plan with pricing, costs, revenue, and runway assumptions. |
| Demo (20%) | Public video under three minutes. Explain the role of each partner and show its verified evidence. |
| Building in public (15%) | Public quote post on the official submission thread with team, project, public repository, demo link, and `#neatHack`. |
| Usefulness/originality (10%) | Explain the concrete hiring decision supported and the human-review boundary. |

## Build and public evidence

- [x] Verify the selected runs use a live CrustData listing and LiteLLM; both are clearly labeled in the app.
- [x] Capture the failed model action, retained role/workflow state, and resumed run; details and run IDs are in `evidence.md`.
- [x] Confirm the cfo.ai plan includes price, customers, revenue, inference and hosting costs, gross margin, burn, and runway; inputs are labeled as assumptions.
- [x] Push the implementation branch and verify the public repository has project-specific setup instructions, no committed secrets, no AWS/Neatlogs private setup notes, and commits dated during neatHack.
- [ ] Confirm both JobSmith Neatlogs sessions are finalized and capture public dashboard links. Session IDs and measured results are in `evidence.md`.
- [ ] Approve the seven pending Codex hooks in `/hooks`, then verify Entire records a checkpoint for this branch.
- [ ] Replace pending trace references in `evidence.md` only after verifying the traces in the dashboard.
- [ ] Record and publish a video under three minutes using [`demo-script.md`](demo-script.md); show verified partner proof and keep the directional-comparison caveat.

## Publish

- [x] Confirm the team name and member details: Hacktopus, solo member Pratik Daithankar.
- [ ] Confirm the team is checked in and its team details are correct in the event system.
- [ ] On October 12, 2026, submit during the 7:00-11:55 PM IST planned window; check Discord for the actual cutoff and the official post.
- [ ] When the official post is live, quote-post it on X with the team, project name, public repository, and public demo link. Keep the original official post attached.
- [ ] Publish the prepared copy in `social-post-draft.md` after replacing every placeholder and checking each claim against `evidence.md`.
- [ ] Aim to post early in the submission window: the official page says neatlogs and cfo.ai will engage with the first 50 quote tweets.
- [ ] Verify the X post is public and the video and repository links open without sign-in.
