import { createOpenAI } from "@ai-sdk/openai";

export type ExecutionMode = "litellm" | "gmicloud" | "sample";
export type LiveProvider = Exclude<ExecutionMode, "sample">;

export type ProviderEnvironment = {
  LITELLM_API_KEY?: string;
  LITELLM_BASE_URL?: string;
  LITELLM_MODEL?: string;
  GMICLOUD_API_KEY?: string;
  GMICLOUD_BASE_URL?: string;
  GMICLOUD_MODEL?: string;
  [key: string]: string | undefined;
};

export type ModelConfiguration = {
  provider: LiveProvider;
  baseURL: string;
  model: string;
};

const defaultLiteLlmBaseUrl = "https://litellm.vision.aivar.app/v1";
const defaultLiteLlmModel = "claude-haiku";
const defaultGmiCloudBaseUrl = "https://api.gmi-serving.com/v1";
const defaultGmiCloudModel = "Qwen/Qwen3.8-Max";

function hasKey(value?: string): value is string {
  return Boolean(value?.trim());
}

export function resolveNewExecutionMode(env: ProviderEnvironment = process.env): ExecutionMode {
  return hasKey(env.LITELLM_API_KEY) ? "litellm" : "sample";
}

export function resolveModelConfiguration(
  mode: ExecutionMode,
  env: ProviderEnvironment = process.env,
): ModelConfiguration | undefined {
  if (mode === "sample") return undefined;

  if (mode === "gmicloud") {
    if (!hasKey(env.GMICLOUD_API_KEY)) return undefined;
    return {
      provider: "gmicloud",
      baseURL: env.GMICLOUD_BASE_URL?.trim() || defaultGmiCloudBaseUrl,
      model: env.GMICLOUD_MODEL?.trim() || defaultGmiCloudModel,
    };
  }

  if (!hasKey(env.LITELLM_API_KEY)) return undefined;
  return {
    provider: "litellm",
    baseURL: env.LITELLM_BASE_URL?.trim() || defaultLiteLlmBaseUrl,
    model: env.LITELLM_MODEL?.trim() || defaultLiteLlmModel,
  };
}

export function createAgentModel(mode?: ExecutionMode) {
  const selectedMode = mode ?? resolveNewExecutionMode();
  const config = resolveModelConfiguration(selectedMode);
  if (!config) {
    if (selectedMode === "sample") return undefined;
    if (selectedMode === "litellm") throw new Error("LiteLLM is selected but LITELLM_API_KEY is missing. Add it to .env.local and restart the app.");
    throw new Error("This saved run requires its legacy GMI Cloud configuration. Check GMICLOUD_API_KEY in .env.local before resuming it.");
  }

  const apiKey = config.provider === "litellm"
    ? process.env.LITELLM_API_KEY
    : process.env.GMICLOUD_API_KEY;
  if (!hasKey(apiKey)) return undefined;

  return createOpenAI({ apiKey, baseURL: config.baseURL }).chat(config.model);
}

export function liveProviderLabel(mode: ExecutionMode): string {
  if (mode === "litellm") return `LiteLLM · ${process.env.LITELLM_MODEL?.trim() || defaultLiteLlmModel}`;
  if (mode === "gmicloud") return `GMI Cloud · ${process.env.GMICLOUD_MODEL?.trim() || defaultGmiCloudModel}`;
  return "Deterministic sample preview";
}
