from app.agents.profile_agent import build_persona
from app.agents.repo_search_agent import find_repos
from app.agents.issue_agent import fetch_issues
from app.agents.recommendation_agent import generate_recommendations
from app.agents.ranking_agent import rank_repos




def run_matcher(profile):
    persona = build_persona(profile)
    repos = find_repos(persona)

    # Rank repositories based on full user profile
    ranked_repos = rank_repos(repos, persona)

    issues_map = {}
    for repo in ranked_repos:
        issues_map[repo["full_name"]] = fetch_issues(repo, persona["experience"])

    return generate_recommendations(ranked_repos, issues_map)