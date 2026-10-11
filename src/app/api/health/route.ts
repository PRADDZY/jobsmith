import { connection } from "next/server";
import { resolveNewExecutionMode } from "@/lib/provider";

export async function GET() {
  await connection();

  return Response.json({
    status: "ok",
    integrations: {
      litellmKeyPresent: Boolean(process.env.LITELLM_API_KEY),
      model: process.env.LITELLM_MODEL?.trim() || "claude-haiku",
      crustdataKeyPresent: Boolean(process.env.CRUSTDATA_API_KEY),
      neatlogsKeyPresent: Boolean(process.env.NEATLOGS_API_KEY),
    },
    agentMode: resolveNewExecutionMode(),
  });
}
