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

function publicUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeRole(raw: UnknownRecord, index: number): RoleSignal {
  const job = (raw.job_details && typeof raw.job_details === "object" ? raw.job_details : raw) as UnknownRecord;
  const company = (raw.company && typeof raw.company === "object" ? raw.company : {}) as UnknownRecord;
  const companyInfo = (company.basic_info && typeof company.basic_info === "object" ? company.basic_info : company) as UnknownRecord;
  const location = (raw.location && typeof raw.location === "object" ? raw.location : {}) as UnknownRecord;
  const content = (raw.content && typeof raw.content === "object" ? raw.content : {}) as UnknownRecord;
  return {
    id: stringValue(raw.crustdata_job_id ?? raw.id ?? raw.job_id, `crustdata-${index}`).slice(0, 200),
    title: stringValue(job.title ?? raw.title).slice(0, 180),
    company: stringValue(companyInfo.name ?? raw.company_name).slice(0, 180),
    location: stringValue(location.raw ?? job.location ?? raw.location).slice(0, 180),
    postedAt: stringValue(nestedString(raw, ["metadata", "date_added"]) ?? raw.date_added).slice(0, 100),
    url: publicUrl(job.url ?? raw.url),
    description: stringValue(content.description ?? job.description ?? raw.description, "No description supplied by the listing.").slice(0, 7000),
    source: "crustdata",
  };
}

export async function searchSupportRoles(): Promise<{ roles: RoleSignal[]; source: "crustdata" | "sample"; warning?: string }> {
  const apiKey = process.env.CRUSTDATA_API_KEY;
  if (!apiKey) return { roles: sampleRoleSignals, source: "sample" };

  try {
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
            { field: "content.description", type: "(.)", value: "support" },
          ],
        },
        limit: 12,
        fields: ["crustdata_job_id", "job_details.title", "job_details.url", "company.basic_info.name", "location.raw", "content.description", "metadata.date_added"],
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`CrustData returned ${response.status}.`);
    const payload = await response.json() as UnknownRecord | UnknownRecord[];
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.job_listings)
        ? payload.job_listings as UnknownRecord[]
        : Array.isArray(payload.jobs)
        ? payload.jobs as UnknownRecord[]
        : Array.isArray(payload.data)
          ? payload.data as UnknownRecord[]
          : [];
    if (!rows.length) throw new Error("CrustData returned no matching roles.");
    return { roles: rows.slice(0, 12).map(normalizeRole), source: "crustdata" };
  } catch {
    return {
      roles: sampleRoleSignals,
      source: "sample",
      warning: "CrustData could not be reached. These bundled listings are samples, not live job posts.",
    };
  }
}
