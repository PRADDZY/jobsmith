import "server-only";
import { init } from "neatlogs";

let initialization: Promise<void> | undefined;

export function ensureObservability(): Promise<void> {
  if (!initialization) {
    initialization = init({
      apiKey: process.env.NEATLOGS_API_KEY,
      endpoint: process.env.NEATLOGS_ENDPOINT || "https://ingest.neatlogs.com",
      workflowName: "jobsmith-support-evaluation",
      pii: "redact",
    });
  }
  return initialization;
}
