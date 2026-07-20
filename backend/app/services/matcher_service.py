from concurrent.futures import ThreadPoolExecutor
import time

from app.agents.issue_agent import fetch_issues
from app.agents.keyword_extraction_agent import extract_keywords
from app.agents.ranking_agent import rank_repos
from app.agents.recommendation_agent import generate_recommendations
from app.agents.repo_search_agent import find_repos


def run_matcher(profile, include_issues=True):
    total_started = time.perf_counter()
    keyword_started = time.perf_counter()
    keywords = extract_keywords(profile.interests or "open source")
    print(f"[MATCHER] keyword_extraction total_time={time.perf_counter() - keyword_started:.4f}s")

    persona = {
        "stack": profile.tech_stack,
        "level": profile.skill_level,
        "interests": profile.interests,
        "experience": profile.open_source_experience,
        "extracted_keywords": keywords,
    }

    search_started = time.perf_counter()
    repos = find_repos(persona)
    print(
        f"[MATCHER] repository_search total_time={time.perf_counter() - search_started:.4f}s "
        f"returned={len(repos)}"
    )

    ranking_started = time.perf_counter()
    ranked_repos, ranking_response = rank_repos(repos, persona)
    ranked_repos = (ranked_repos or repos)[:50]
    print(
        f"[MATCHER] repository_ranking total_time={time.perf_counter() - ranking_started:.4f}s "
        f"returned={len(ranked_repos)}"
    )

    issues = {}
    if include_issues and ranked_repos:
        with ThreadPoolExecutor(max_workers=20) as executor:
            results = executor.map(
                fetch_issues,
                ranked_repos,
                [persona["experience"]] * len(ranked_repos),
            )
            issues = {
                repo["full_name"]: result
                for repo, result in zip(ranked_repos, results)
            }

    total = len(ranked_repos)
    serialization_started = time.perf_counter()
    recommendations = generate_recommendations(ranked_repos, issues)
    print(f"[MATCHER] serialization total_time={time.perf_counter() - serialization_started:.4f}s")
    print(f"[MATCHER] complete total_time={time.perf_counter() - total_started:.4f}s")
    return {
        "recommendations": recommendations,
        "gemini_response": ranking_response,
        "pagination": {
            "current_page": 1,
            "total_pages": (total + 11) // 12,
            "repos_per_page": 12,
            "total_repos": total,
        },
    }
