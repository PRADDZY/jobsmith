import { ensureObservability } from "./lib/observability";

export async function register() {
  await ensureObservability();
}
