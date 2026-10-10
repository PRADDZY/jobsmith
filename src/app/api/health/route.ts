export async function GET() {
  return Response.json({
    status: "ok",
    integrations: {
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      crustdata: Boolean(process.env.CRUSTDATA_API_KEY),
      neatlogs: Boolean(process.env.NEATLOGS_API_KEY),
    },
    agentMode: process.env.OPENROUTER_API_KEY ? "openrouter" : "rules-preview",
  });
}
