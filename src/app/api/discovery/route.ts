import { trace } from "neatlogs";
import { searchSupportRoles } from "@/lib/discovery";
import { ensureObservability } from "@/lib/observability";

export async function POST() {
  try {
    await ensureObservability();
    const result = await trace({
      name: "jobsmith.market-discovery",
      sessionFeatureName: "support-role-discovery",
      sessionEntryPoint: "role-signal-panel",
      input: { query: "Customer Support", limit: 12 },
    }, searchSupportRoles);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market discovery failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
