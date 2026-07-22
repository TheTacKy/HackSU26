const NOISE = new Set([
  "and", "coding", "contribute", "for", "help", "interested", "involving",
  "looking", "open", "project", "projects", "source", "the", "want", "with",
  "really", "into", "about", "like", "work", "working", "build", "building",
]);

const LEADING_FILLER = /^(?:i\s+(?:am|'m)\s+)?(?:really\s+)?(?:interested\s+in|looking\s+for|want\s+to\s+(?:work\s+on|contribute\s+to)|like)\s+/i;

function clean(candidate: string): string {
  return candidate
    .replace(LEADING_FILLER, "")
    .replace(/\b(?:projects?|repositories|repos?)\b/gi, "")
    .replace(/^[\s,.;:!?-]+|[\s,.;:!?-]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function extractKeywords(input: string): string[] {
  const started = performance.now();
  const text = input.trim();
  if (!text) return ["open source"];

  const segments = text
    .replace(LEADING_FILLER, "")
    .split(/\s*(?:,|;|\band\b|\bor\b)\s*/i)
    .map(clean)
    .filter(Boolean);

  let keywords = [...new Set(segments)]
    .filter((phrase) => phrase.split(/\s+/).some((word) => !NOISE.has(word)))
    .slice(0, 8);

  if (!keywords.length) {
    keywords = [...new Set(text.toLowerCase().match(/[a-z0-9+#.-]{3,}/g) ?? [])]
      .filter((word) => !NOISE.has(word))
      .slice(0, 8);
  }
  if (!keywords.length) keywords = ["open source"];

  console.log(`[KEYWORD_EXTRACTION] local time=${secondsSince(started)}s keywords=${JSON.stringify(keywords)}`);
  return keywords;
}

function secondsSince(started: number): string {
  return ((performance.now() - started) / 1_000).toFixed(4);
}
