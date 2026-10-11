# JobSmith demo script (2:48 target)

Keep this recording as a draft until the Neatlogs traces and Entire checkpoint below are visible and verified. The event requires a public demo of three minutes or less. Show no customer data; every support case and policy is synthetic.

## 0:00-0:15 | The decision

"JobSmith tests whether one support duty is ready for a supervised AI coworker pilot. It starts from a real public job listing, runs synthetic cases through a bounded workflow, and gives a go or no-go recommendation."

Show the final recommendation first. State the boundary: there is no customer inbox, reply sending, or account access connected.

## 0:15-0:32 | A real role, a bounded task

Open the live CrustData listing for Technical Customer Support (Arabic Speaker) at respond.io. Point to the source quote and link. Show the selected repeatable duty and the goal given to the agent. If the live listing has disappeared, use a clearly marked sample and call it a sample.

## 0:32-1:10 | The agent completes the task

Start probation. Show the plan, retrieved policy, one synthetic access-recovery case, the unsent draft, and the independent claim check. Explain how the agent uses each result to decide what to do next. Open a held-out case and point to its source policy citation. Show that missing recovery details or offered credentials route to a person.

## 1:10-1:30 | Failure, retained state, recovery

Open the earlier run at its structured-output failure. Show that the role and workflow state were saved, resume that same pilot, and point to the completed case list without duplicates. Explain that the first response failed schema validation; the agent resumed after the output schema was made provider-compatible and model text was bounded locally.

## 1:30-1:50 | Evidence of improvement

Compare the before and after runs: 2/4 versus 4/4 synthetic checks passed, and the recommendation changed from no-go to supervised pilot candidate. State that each run had only two practice and two held-out cases, and the model-selected duty titles differed, so this is directional evidence rather than a controlled A/B test. A passing result only permits a supervised sandbox pilot.

## 1:50-2:12 | Neatlogs: runtime evidence and iteration

Open the verified before and after trace links in `evidence.md`. Describe the architecture and implementation: the Neatlogs SDK traces the model, policy tool, verification, and recovery path. Show the runtime spans and any latency, token, or cost fields that are actually present. Explain the failure the traces exposed, the code change it motivated, and the measured result. Do not claim fields the trace does not show.

## 2:12-2:28 | Entire: build context behind the fix

Open the verified Entire checkpoint or graph for this branch. Point to the saved coding context and the changes for provider-compatible output, bounded verification, and failure recovery. Explain why that context helped make and review the fix; show the resulting checkpoint on the public repository branch.

## 2:28-2:42 | cfo.ai: business assumptions

Open the editable JobSmith plan. Show the proposed price and customer assumptions, revenue, inference and hosting costs, gross margin, burn, and runway. Explain that cfo.ai was used to test whether the supervised evaluation service could support a business; the figures are planning assumptions, not validated results.

## 2:42-2:48 | Close

"JobSmith turns an AI coworker idea into evidence for a supervised next step, never autonomous production approval."

## Capture notes

- Keep the final video under three minutes, including transitions. Rehearse once with a timer and leave a few seconds of margin.
- Use the verified public trace links and checkpoint in the recording. If any link is still pending, record only a private draft and replace that segment before publishing.
- Keep synthetic names and evaluator labels out of the recording.
- Preserve the directional-comparison caveat wherever the 2/4 and 4/4 results appear.
- Make the three partner roles explicit in narration: Neatlogs captures and informs runtime improvement; Entire preserves the coding context and change history; cfo.ai models the business assumptions.
