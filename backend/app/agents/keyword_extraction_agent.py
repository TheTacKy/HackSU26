import re
import time

import yake


extractor = yake.KeywordExtractor(
    lan="en",
    n=3,
    dedupLim=0.9,
    dedupFunc="seqm",
    windowsSize=1,
    top=8,
)

NOISE_WORDS = {
    "and", "coding", "contribute", "for", "help", "interested", "involving",
    "looking", "open", "project", "projects", "source", "the", "want", "with",
}

PROTECTED_TERM_PATTERN = re.compile(
    r"\b(?:[A-Z][A-Z0-9+#.-]{1,}|[A-Z][A-Za-z0-9+#.-]{2,}\s+[a-z][A-Za-z0-9+#.-]+)\b"
)


def extract_keywords(interests_prompt):
    text = interests_prompt.strip() if interests_prompt else ""
    if not text:
        return ["open source"]

    started = time.perf_counter()
    try:
        protected_terms = PROTECTED_TERM_PATTERN.findall(text)
        yake_keywords = _clean_keywords(extractor.extract_keywords(text))
        keywords = _merge_keywords(protected_terms, yake_keywords)
    except Exception as error:
        print(f"[KEYWORD_EXTRACTION] YAKE failed: {error}")
        keywords = []

    if not keywords:
        keywords = _fallback_keyword_extraction(text)

    print(
        f"[KEYWORD_EXTRACTION] YAKE time={time.perf_counter() - started:.4f}s "
        f"keywords={keywords}"
    )
    return keywords


def _fallback_keyword_extraction(text):
    words = re.findall(r"\b\w{3,}\b", text.lower())
    keywords = list(dict.fromkeys(word for word in words if word not in NOISE_WORDS))
    return keywords[:8] or ["open source"]


def _clean_keywords(results):
    keywords = []
    for keyword, _score in results:
        keyword = keyword.lower().strip()
        words = set(re.findall(r"\b\w+\b", keyword))
        if not words or words & NOISE_WORDS:
            continue
        if any(words <= set(existing.split()) for existing in keywords):
            continue
        keywords.append(keyword)
    return keywords


def _merge_keywords(*groups):
    candidates = []
    for keyword in (item for group in groups for item in group):
        keyword = keyword.lower().strip()
        words = set(re.findall(r"\b\w+\b", keyword))
        if not words or words & NOISE_WORDS:
            continue
        if keyword in candidates:
            continue
        candidates.append(keyword)

    return [
        keyword
        for keyword in candidates
        if not any(
            set(keyword.split()) < set(other.split())
            for other in candidates
        )
    ][:8]
