from app.agents.profile_agent import build_persona
from app.agents.repo_search_agent import find_repos
from app.agents.issue_agent import fetch_issues
from app.agents.recommendation_agent import generate_recommendations
from app.agents.ranking_agent import rank_repos
from app.agents.keyword_extraction_agent import extract_keywords




def run_matcher(profile, page=1):
    persona = build_persona(profile)
    
    # Extract keywords from interests prompt using OpenAI
    interests_prompt = persona.get("interests", "") or "open source"
    extracted_keywords = extract_keywords(interests_prompt)
    
    # Add extracted keywords to persona for repo search
    persona["extracted_keywords"] = extracted_keywords
    
    repos = find_repos(persona)
    
    # Check if we have repos before ranking
    if not repos or len(repos) == 0:
        return {
            "recommendations": [],
            "gemini_response": "No repositories found matching your criteria.",
            "pagination": {
                "current_page": page,
                "total_pages": 0,
                "repos_per_page": 12,
                "total_repos": 0
            }
        }

    # Rank repositories based on full user profile (rank all repos, not just 12)
    ranked_repos, gemini_response = rank_repos(repos, persona)
    
    # Ensure we have ranked repos
    if not ranked_repos or len(ranked_repos) == 0:
        ranked_repos = repos  # Fallback to original order if ranking failed

    # Pagination: 12 repos per page
    repos_per_page = 12
    start_idx = (page - 1) * repos_per_page
    end_idx = start_idx + repos_per_page
    paginated_repos = ranked_repos[start_idx:end_idx]
    
    # Check if paginated repos exist for this page
    if not paginated_repos or len(paginated_repos) == 0:
        return {
            "recommendations": [],
            "gemini_response": f"No repositories found for page {page}. Try page 1.",
            "pagination": {
                "current_page": page,
                "total_pages": (len(ranked_repos) + repos_per_page - 1) // repos_per_page,
                "repos_per_page": repos_per_page,
                "total_repos": len(ranked_repos)
            }
        }

    issues_map = {}
    for repo in paginated_repos:
        issues_map[repo["full_name"]] = fetch_issues(repo, persona["experience"])

    recommendations = generate_recommendations(paginated_repos, issues_map)
    
    # Calculate total pages (assuming we have at least 36 repos ranked)
    total_repos = len(ranked_repos)
    total_pages = min(3, (total_repos + repos_per_page - 1) // repos_per_page)
    
    # Add Gemini response to the results for debugging
    return {
        "recommendations": recommendations,
        "gemini_response": gemini_response,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "repos_per_page": repos_per_page,
            "total_repos": total_repos
        }
    }