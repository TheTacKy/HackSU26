from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone

from app.github_client import search_repositories


MAX_KEYWORDS = 3
MAX_REPOS_PER_KEYWORD = 30


def find_repos(persona):
    keywords = persona["extracted_keywords"][:MAX_KEYWORDS]
    languages = {language.lower() for language in persona.get("stack", [])}
    pushed_after = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
    filters = f"is:public+archived:false+has:issues+pushed:>{pushed_after}"
    queries = {
        keyword: f"{_quote(keyword)}+{filters}"
        for keyword in keywords
    }

    results_by_keyword = {}
    with ThreadPoolExecutor(max_workers=len(queries) or 1) as executor:
        futures = {
            executor.submit(search_repositories, query, 50): keyword
            for keyword, query in queries.items()
        }
        for future in as_completed(futures):
            keyword = futures[future]
            try:
                results_by_keyword[keyword] = future.result()
            except Exception as error:
                print(f"[GITHUB_API] search failed keyword={keyword!r}: {error}")
                results_by_keyword[keyword] = []

    repos = {}
    scores = {}
    for keyword in keywords:
        accepted = 0
        for repo in results_by_keyword.get(keyword, []):
            if not _eligible(repo, languages):
                continue

            repo_id = repo["id"]
            repos[repo_id] = repo
            scores.setdefault(repo_id, 0)
            scores[repo_id] += MAX_REPOS_PER_KEYWORD - accepted

            searchable_text = " ".join(
                filter(None, [repo.get("name"), repo.get("description")])
            ).lower()
            if keyword.lower() in searchable_text:
                scores[repo_id] += 5
            if (repo.get("language") or "").lower() in languages:
                scores[repo_id] += 3

            accepted += 1
            if accepted == MAX_REPOS_PER_KEYWORD:
                break

    active_repos = [repo for repo in repos.values() if _recently_updated(repo)]
    active_repos.sort(
        key=lambda repo: (scores[repo["id"]], repo.get("stargazers_count", 0)),
        reverse=True,
    )
    return active_repos[:50]


def _quote(keyword):
    return f'"{keyword}"' if " " in keyword else keyword


def _eligible(repo, languages):
    if repo.get("archived") or repo.get("private"):
        return False
    repo_language = (repo.get("language") or "").lower()
    return not languages or not repo_language or any(
        language == repo_language
        or language in repo_language
        or repo_language in language
        for language in languages
    )


def _recently_updated(repo):
    updated_at = repo.get("updated_at")
    if not updated_at:
        return False
    try:
        updated = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=timezone.utc)
        return updated >= datetime.now(timezone.utc) - timedelta(days=90)
    except (TypeError, ValueError):
        return True
