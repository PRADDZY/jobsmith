import { getPilot } from "@/lib/store";
import { resumePilot } from "@/lib/pilot-runs";

export const maxDuration = 180;

export async function POST(_request: Request, context: { params: Promise<{ pilotId: string }> }) {
  const { pilotId } = await context.params;
  const pilot = getPilot(pilotId);
  if (!pilot) return Response.json({ error: "Pilot run was not found." }, { status: 404 });
  if (pilot.status === "blocked") return Response.json({ error: pilot.blockedReason ?? "This listing cannot be evaluated." }, { status: 409 });
  try {
    await resumePilot(pilotId);
    return Response.json({ pilot: getPilot(pilotId) });
  } catch {
    return Response.json({ error: "The run paused unexpectedly. Saved work is preserved; resume it to continue." }, { status: 500 });
  }
}
