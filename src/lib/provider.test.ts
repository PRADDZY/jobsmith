import { describe, expect, it } from "vitest";
import { resolveModelConfiguration, resolveNewExecutionMode } from "./provider";

describe("model provider selection", () => {
  it("uses LiteLLM for new runs when configured", () => {
    expect(resolveNewExecutionMode({ LITELLM_API_KEY: "test-key" })).toBe("litellm");
  });

  it("does not silently fall back to GMI Cloud for a new run", () => {
    expect(resolveNewExecutionMode({ GMICLOUD_API_KEY: "old-test-key" })).toBe("sample");
    expect(resolveModelConfiguration("litellm", { GMICLOUD_API_KEY: "old-test-key" })).toBeUndefined();
  });

  it("uses the configured LiteLLM model alias and endpoint", () => {
    const config = resolveModelConfiguration("litellm", {
      LITELLM_API_KEY: "test-key",
      LITELLM_BASE_URL: "https://models.example/v1",
      LITELLM_MODEL: "claude-haiku",
    });

    expect(config).toMatchObject({ provider: "litellm", baseURL: "https://models.example/v1", model: "claude-haiku" });
  });

  it("keeps explicit legacy GMI Cloud runs readable without using it for new runs", () => {
    expect(resolveModelConfiguration("gmicloud", {
      GMICLOUD_API_KEY: "legacy-test-key",
      GMICLOUD_BASE_URL: "https://legacy.example/v1",
      GMICLOUD_MODEL: "legacy-model",
    })).toMatchObject({ provider: "gmicloud", baseURL: "https://legacy.example/v1", model: "legacy-model" });
  });

  it("does not resolve a model for an explicitly selected sample preview", () => {
    expect(resolveModelConfiguration("sample", { LITELLM_API_KEY: "test-key" })).toBeUndefined();
  });
});
