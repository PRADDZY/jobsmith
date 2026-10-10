import type { RoleSignal } from "./contracts";
import { sampleRoleSignals } from "./fixtures";

type UnknownRecord = Record<string, unknown>;

function stringValue(value: unknown, fallback = "Not listed"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nestedString(record: UnknownRecord, path: string[]): string | undefined {
  let value: unknown = record;
  for (const key of path) {
    if (!value || typeof value !== "object") return undefined;
    value = (value as UnknownRecord)[key];
  }
  return typeof value === "string" ? value : undefined;
}

function normalizeRole(raw: UnknownRecord, index: number): RoleSignal {
  const job = (raw.job_details && typeof raw.job_details === "object" ? raw.job_details : raw) as UnknownRecord;
  const company = (raw.company && typeof raw.company === "object" ? raw.company : {}) as UnknownRecord;
  return {
    id: stringValue(raw.id ?? raw.job_id, `crustdata-${index}`),
    title: stringValue(job.title ?? raw.title),
    company: stringValue(company.name ?? raw.company_name),
    location: stringValue(job.location ?? raw.location),
    postedAt: stringValue(nestedString(raw, ["metadata", "date_added"]) ?? raw.date_added),
    url: stringValue(job.url ?? raw.url, "") || undefined,
    description: stringValue(job.description ?? raw.description, "No description supplied by the listing."),
    source: "crustdata",
  };
}

export async function searchSupportRoles(): Promise<{ roles: RoleSignal[]; source: "crustdata" | "sample" }> {
  const apiKey = process.env.CRUSTDATA_API_KEY;
  if (!apiKey) return { roles: sampleRoleSignals, source: "sample" };

  const response = await fetch("https://api.crustdata.com/job/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "x-api-version": "2025-11-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filters: {
        op: "and",
        conditions: [
          { field: "job_details.title", type: "(.)", value: "Customer Support" },
          { field: "job_details.description", type: "(.)", value: "support" },
        ],
      },
      limit: 12,
      fields: ["job_details.title", "job_details.description", "job_details.location", "job_details.url", "company.name", "metadata.date_added"],
    }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`CrustData returned ${response.status}: ${detail}`);
  }
  const payload = await response.json() as UnknownRecord | UnknownRecord[];
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.jobs)
      ? payload.jobs as UnknownRecord[]
      : Array.isArray(payload.data)
        ? payload.data as UnknownRecord[]
        : [];
  return { roles: rows.slice(0, 12).map(normalizeRole), source: "crustdata" };
}
