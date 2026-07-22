import { describe, expect, it } from "vitest";
import { parseRanking } from "../src/ranking.js";

describe("parseRanking", () => {
  it("deduplicates valid indexes and appends missing indexes", () => {
    expect(parseRanking("2, 0, 2, 99", 4)).toEqual([2, 0, 1, 3]);
  });
});
