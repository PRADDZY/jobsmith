import { getRun } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const run = getRun(runId);
  return run ? Response.json({ run }) : Response.json({ error: "Evaluation run was not found." }, { status: 404 });
}
