import { describe, expect, it } from "vitest";
import { parseRanking } from "../src/services/ranking-service.js";

describe("parseRanking", () => {
  it("keeps repositories in the requested order", () => {
    // Arrange: three repositories, numbered 0, 1, and 2.
    const ranking = "2, 0, 1";

    // Act: convert the ranking text into repository indexes.
    const result = parseRanking(ranking, 3);

    // Assert: the order should match the ranking.
    expect(result).toEqual([2, 0, 1]);
  });

  it("deduplicates valid indexes and appends missing indexes", () => {
    expect(parseRanking("2, 0, 2, 99", 4)).toEqual([2, 0, 1, 3]);
  });

  it("keeps the original order when the ranking is empty", () => {
    expect(parseRanking("", 3)).toEqual([0, 1, 2]);
  });

  it("returns an empty list when there are no repositories", () => {
    expect(parseRanking("", 0)).toEqual([]);
  });
});
