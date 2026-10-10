import { createRun, listRuns } from "@/lib/store";
import type { RunMode } from "@/lib/contracts";
import { supportCases } from "@/lib/fixtures";

export async function GET() {
  return Response.json({ runs: listRuns() });
}

export async function POST(request: Request) {
  let body: { mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (body.mode !== "practice" && body.mode !== "evaluation") {
    return Response.json({ error: "Choose practice or evaluation mode." }, { status: 400 });
  }
  const mode = body.mode as RunMode;
  const count = supportCases.filter((testCase) => testCase.practice === (mode === "practice")).length;
  return Response.json({ run: createRun(mode, count) }, { status: 201 });
}
