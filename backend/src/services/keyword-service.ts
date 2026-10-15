import { extract } from "@ade_oshineye/yaket";

const NOISE_WORDS = new Set([
  "and", "coding", "contribute", "for", "help", "interested", "involving",
  "looking", "open", "project", "projects", "source", "the", "want", "with",
]);

const PROTECTED_TERM_PATTERN = /\b(?:[A-Z][A-Z0-9+#.-]{1,}|[A-Z][A-Za-z0-9+#.-]{2,}\s+[a-z][A-Za-z0-9+#.-]+)\b/g;

const options = {
  language: "en",
  n: 3,
  dedupLim: 0.9,
  dedupFunc: "seqm" as const,
  windowSize: 1,
  top: 8,
};

export function extractKeywords(input: string): string[] {
  const text = input.trim();
  if (!text) return ["open source"];

  const started = performance.now();
  let keywords: string[] = [];
  try {
    const protectedTerms = text.match(PROTECTED_TERM_PATTERN) ?? [];
    const yakeKeywords = cleanKeywords(extract(text, options).map(([keyword]) => keyword));
    keywords = mergeKeywords(protectedTerms, yakeKeywords);
  } catch (error) {
    console.log(`[KEYWORD_EXTRACTION] YAKE failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!keywords.length) keywords = fallbackKeywords(text);
  console.log(`[KEYWORD_EXTRACTION] YAKE time=${secondsSince(started)}s keywords=${JSON.stringify(keywords)}`);
  return keywords;
}

function cleanKeywords(results: string[]): string[] {
  const keywords: string[] = [];
  for (const result of results) {
    const keyword = result.toLowerCase().trim();
    const words = wordSet(keyword);
    if (!words.size || intersectsNoise(words)) continue;
    if (keywords.some((existing) => isSubset(words, wordSet(existing)))) continue;
    keywords.push(keyword);
  }
  return keywords;
}

function mergeKeywords(...groups: string[][]): string[] {
  const candidates: string[] = [];
  for (const item of groups.flat()) {
    const keyword = item.toLowerCase().trim();
    const words = wordSet(keyword);
    if (!words.size || intersectsNoise(words) || candidates.includes(keyword)) continue;
    candidates.push(keyword);
  }

  return candidates
    .filter((keyword) => !candidates.some((other) => keyword !== other && isStrictSubset(wordSet(keyword), wordSet(other))))
    .slice(0, 8);
}

function fallbackKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/\b\w{3,}\b/g) ?? [];
  const keywords = [...new Set(words.filter((word) => !NOISE_WORDS.has(word)))];
  return keywords.slice(0, 8).length ? keywords.slice(0, 8) : ["open source"];
}

function wordSet(value: string): Set<string> {
  return new Set(value.match(/\b\w+\b/g) ?? []);
}

function intersectsNoise(words: Set<string>): boolean {
  return [...words].some((word) => NOISE_WORDS.has(word));
}

function isSubset(left: Set<string>, right: Set<string>): boolean {
  return [...left].every((word) => right.has(word));
}

function isStrictSubset(left: Set<string>, right: Set<string>): boolean {
  return left.size < right.size && isSubset(left, right);
}

function secondsSince(started: number): string {
  return ((performance.now() - started) / 1_000).toFixed(4);
}
