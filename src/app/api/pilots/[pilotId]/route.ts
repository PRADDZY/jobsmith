import { getPilot } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ pilotId: string }> }) {
  const { pilotId } = await context.params;
  const pilot = getPilot(pilotId);
  return pilot ? Response.json({ pilot }) : Response.json({ error: "Pilot run was not found." }, { status: 404 });
}
