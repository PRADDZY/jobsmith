# JobSmith

JobSmith puts an AI coworker through probation before recommending a support pilot. It uses job-posting evidence to choose a support task, tests a bounded ticket workflow against synthetic cases, and models the economics with editable assumptions.

## Project status

Hackathon build in progress. This repository is the source of truth for the application and its verification evidence. No production support system is connected; all ticket fixtures and knowledge-base articles are synthetic.

## Planned integrations

- **CrustData:** indexed support-role postings with source links and posting dates.
- **OpenRouter:** structured workflow generation and ticket response drafts.
- **neatlogs:** traces for discovery, workflow runs, verification, retries, and CFO scenario creation.
- **Entire:** coding session checkpoints and repository Graph evidence.
- **cfo.ai:** a customer pilot scenario and a separate JobSmith business plan.

## Local setup

1. Use Node.js 22 or later and npm.
2. Copy `.env.example` to `.env.local` and fill the required credentials locally.
3. Install dependencies with `npm ci`.
4. Start the web app and worker with `npm run dev`.

The integration setup, supported demo path, evidence links, and verification results will be added as those slices are completed. Never commit `.env.local` or service credentials.

## License

Hackathon project. License to be selected before public release.
