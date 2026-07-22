import { describe, expect, it } from "vitest";
import { extractKeywords } from "../src/keyword-extraction.js";

describe("extractKeywords", () => {
  it("preserves distinct interest phrases", () => {
    expect(extractKeywords("I am really interested in Pokemon go, AI, and video games"))
      .toEqual(["pokemon go", "ai", "video games"]);
  });

  it("keeps a short topic intact", () => {
    expect(extractKeywords("game development")).toEqual(["game development"]);
    expect(extractKeywords("minecraft mods")).toEqual(["minecraft mods"]);
  });

  it("uses a stable fallback for empty input", () => {
    expect(extractKeywords("  ")).toEqual(["open source"]);
  });
});
