export async function GET() {
  return Response.json({
    status: "ok",
    integrations: {
      gmicloud: Boolean(process.env.GMICLOUD_API_KEY),
      crustdata: Boolean(process.env.CRUSTDATA_API_KEY),
      neatlogs: Boolean(process.env.NEATLOGS_API_KEY),
    },
    agentMode: process.env.GMICLOUD_API_KEY ? "gmicloud" : "sample",
  });
}
