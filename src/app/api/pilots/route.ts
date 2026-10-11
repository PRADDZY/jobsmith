import { z } from "zod";
import { createPilot, getDiscoveredRole, listPilots } from "@/lib/store";
import type { RoleSignal } from "@/lib/contracts";
import { sampleRoleSignals } from "@/lib/fixtures";
import { resolveNewExecutionMode } from "@/lib/provider";

const roleSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(180),
  company: z.string().min(1).max(180),
  location: z.string().max(180),
  postedAt: z.string().max(100),
  url: z.string().url().optional(),
  description: z.string().min(20).max(7000),
  source: z.enum(["crustdata", "sample"]),
});

export async function GET() {
  return Response.json({ pilots: listPilots() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = z.object({
    role: roleSchema,
    sourceWarning: z.string().max(300).optional(),
    executionMode: z.enum(["litellm", "sample"]).optional(),
  }).safeParse(body);
  if (!parsed.success) return Response.json({ error: "Choose a valid role listing before starting the pilot." }, { status: 400 });
  const requestedRole = parsed.data.role as RoleSignal;
  const role = requestedRole.source === "crustdata"
    ? getDiscoveredRole("crustdata", requestedRole.id)
    : sampleRoleSignals.find((item) => item.id === requestedRole.id);
  if (!role) return Response.json({ error: "This listing is no longer available in the workspace. Refresh roles and select it again." }, { status: 409 });
  const executionMode = parsed.data.executionMode ?? resolveNewExecutionMode();
  if (executionMode === "litellm" && !process.env.LITELLM_API_KEY) {
    return Response.json({ error: "Configure LITELLM_API_KEY or choose the labeled sample preview." }, { status: 400 });
  }
  return Response.json({ pilot: createPilot(role, parsed.data.sourceWarning, executionMode) }, { status: 201 });
}
