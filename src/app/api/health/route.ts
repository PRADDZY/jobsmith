import { connection } from "next/server";
import { resolveNewExecutionMode } from "@/lib/provider";

export async function GET() {
  await connection();

  return Response.json({
    status: "ok",
    integrations: {
      litellm: Boolean(process.env.LITELLM_API_KEY),
      model: process.env.LITELLM_MODEL?.trim() || "claude-haiku",
      crustdata: Boolean(process.env.CRUSTDATA_API_KEY),
      neatlogs: Boolean(process.env.NEATLOGS_API_KEY),
    },
    agentMode: resolveNewExecutionMode(),
  });
}
