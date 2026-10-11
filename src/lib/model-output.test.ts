import { describe, expect, it } from "vitest";
import { boundModelText } from "./model-output";

describe("boundModelText", () => {
  it("trims model whitespace without changing an in-range value", () => {
    expect(boundModelText("  A concise finding.  ", 30)).toBe("A concise finding.");
  });

  it("clips long model text to the provider-independent application limit", () => {
    expect(boundModelText("abcdefgh", 5)).toBe("abcde");
  });

  it("removes trailing whitespace after clipping", () => {
    expect(boundModelText("abc   def", 6)).toBe("abc");
  });
});
