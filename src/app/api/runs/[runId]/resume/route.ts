import { resumeEvaluation } from "@/lib/runs";
import { getRun } from "@/lib/store";

export const maxDuration = 180;

export async function POST(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  if (!getRun(runId)) return Response.json({ error: "Evaluation run was not found." }, { status: 404 });
  try {
    await resumeEvaluation(runId);
    return Response.json({ run: getRun(runId) });
  } catch {
    return Response.json({ error: "The run stopped unexpectedly. Completed cases were saved; resume it to continue." }, { status: 500 });
  }
}
