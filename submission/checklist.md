# neatHack submission checklist

## Judge proof map

The [official neatHack page](https://neatlogs.com/hackathon) weights the agent at 30%, partner-tool use at 25%, demo video at 20%, building in public at 15%, and usefulness/originality at 10%.

| Criterion | Evidence to show |
| --- | --- |
| Agent (30%) | Complete role-to-decision run, held-out checks, before/after results, and saved-state recovery. |
| Neatlogs, Entire, cfo.ai (25%) | Finalized before/after traces, a branch checkpoint, and the editable operating plan with pricing, costs, revenue, and runway. |
| Demo (20%) | Under three minutes; explicitly explain each partner's role and show the verified evidence. |
| Building in public (15%) | Public quote post on the official submission thread with `#neatHack`, project, repository, and demo link. |
| Usefulness/originality (10%) | Explain the specific decision JobSmith supports and the human-review boundary. |

## Build and public evidence

- [x] Verify the selected runs use a live CrustData listing and LiteLLM; both are clearly labeled in the app.
- [ ] Confirm both JobSmith Neatlogs sessions finalize and capture their public dashboard links. Session IDs and measured results are in `evidence.md`.
- [x] Capture a failed model action, saved role/workflow state, and a resumed run; recovery details are in `evidence.md`.
- [ ] Approve the seven pending Codex hooks in `/hooks`, then verify Entire records a checkpoint for this branch.
- [x] Confirm the cfo.ai plan includes price, customers, revenue, inference and hosting costs, gross margin, burn, and runway; the scenario labels its inputs as assumptions.
- [ ] Record and publish a demo video of three minutes or less. The video must explicitly explain the role of Neatlogs, Entire, and cfo.ai.
- [ ] Replace pending trace links in `evidence.md` after dashboard verification; measured results are recorded.
- [x] Push the implementation branch and verify the public repository has setup instructions, no secrets, no AWS/Neatlogs setup notes, and commits dated during neatHack.

## Publish

- [x] Confirm team name and all registered team members: Hacktopus, solo member Pratik Daithankar.
- [ ] Wait for the official submission post and the submission window on Oct 12, 2026, 7:00 PM IST; verify the final cutoff on Discord.
- [ ] Quote the official post on X with team, project name, public repository, and demo link; retain the original official post attachment.
- [ ] Publish the prepared social copy in `social-post-draft.md` only after replacing every placeholder and checking the claims against `evidence.md`.
- [ ] Verify that the X post is public and the video and repository links open without sign-in.
