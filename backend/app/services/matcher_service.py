from app.agents.profile_agent import build_persona
from app.agents.repo_search_agent import find_repos
from app.agents.issue_agent import fetch_issues
from app.agents.recommendation_agent import generate_recommendations
from app.agents.ranking_agent import rank_repos
from app.agents.keyword_extraction_agent import extract_keywords




def run_matcher(profile, page=1):
    print(f"\n{'='*60}")
    print(f"[MATCHER] Starting matcher for page {page}")
    print(f"{'='*60}")
    
    persona = build_persona(profile)
    print(f"[MATCHER] Persona built: name={persona.get('name')}, tech_stack={persona.get('stack')}, level={persona.get('level')}, experience={persona.get('experience')}")
    
    # Extract keywords from interests prompt using OpenAI
    interests_prompt = persona.get("interests", "") or "open source"
    print(f"[MATCHER] Interests prompt: {interests_prompt[:100]}...")
    extracted_keywords = extract_keywords(interests_prompt)
    print(f"[MATCHER] Extracted keywords: {extracted_keywords}")
    
    # Add extracted keywords to persona for repo search
    persona["extracted_keywords"] = extracted_keywords
    
    print(f"[MATCHER] Starting repository search...")
    repos = find_repos(persona)
    
    # Debug: Log how many repos were found
    print(f"[MATCHER] Repository search completed: Found {len(repos)} repositories")
    
    # Check if we have repos before ranking
    if not repos or len(repos) == 0:
        print(f"[Page {page}] Warning: No repositories found")
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
    print(f"[Page {page}] Ranking {len(repos)} repositories...")
    
    # Only rank if we have repos
    if len(repos) > 0:
        ranked_repos, gemini_response = rank_repos(repos, persona)
        
        # Ensure we have ranked repos (fallback to original if ranking failed)
        if not ranked_repos or len(ranked_repos) == 0:
            print(f"[Page {page}] Warning: Ranking returned empty, using original order")
            ranked_repos = repos
            if isinstance(gemini_response, str) and "No repositories to rank" in gemini_response:
                gemini_response = "Ranking unavailable, using original order"
    else:
        # Should not reach here due to check above, but just in case
        ranked_repos = []
        gemini_response = "No repositories found"
    
    print(f"[Page {page}] After ranking: {len(ranked_repos)} repositories")

    # Pagination: 12 repos per page
    repos_per_page = 12
    start_idx = (page - 1) * repos_per_page
    end_idx = start_idx + repos_per_page
    paginated_repos = ranked_repos[start_idx:end_idx]
    
    print(f"[Page {page}] Pagination: start_idx={start_idx}, end_idx={end_idx}, total_repos={len(ranked_repos)}, paginated_count={len(paginated_repos)}")
    
    # Check if paginated repos exist for this page
    if not paginated_repos or len(paginated_repos) == 0:
        print(f"[Page {page}] Warning: No repos for this page slice")
        total_pages = max(1, (len(ranked_repos) + repos_per_page - 1) // repos_per_page)
        return {
            "recommendations": [],
            "gemini_response": f"No repositories found for page {page}. Total repos available: {len(ranked_repos)}. Maximum page: {total_pages}",
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "repos_per_page": repos_per_page,
                "total_repos": len(ranked_repos)
            }
        }

    # For page 1, return ALL repos (exactly 36) so frontend can paginate client-side
    # This avoids re-searching for pages 2 and 3
    if page == 1:
        # We already have exactly 36 repos from find_repos, so use all of them
        repos_to_process = ranked_repos[:36]  # Exactly 36 repos (3 pages × 12)
        issues_map = {}
        print(f"[MATCHER] Fetching issues for {len(repos_to_process)} repos...")
        for repo in repos_to_process:
            issues_map[repo["full_name"]] = fetch_issues(repo, persona["experience"])
        
        recommendations = generate_recommendations(repos_to_process, issues_map)
        
        total_repos = len(repos_to_process)
        total_pages = min(3, (total_repos + repos_per_page - 1) // repos_per_page)
        
        print(f"[MATCHER] Returning {len(recommendations)} repos for client-side pagination (single GitHub API call used)")
        return {
            "recommendations": recommendations,  # All 36 repos, frontend will paginate
            "gemini_response": gemini_response,
            "pagination": {
                "current_page": 1,
                "total_pages": total_pages,
                "repos_per_page": repos_per_page,
                "total_repos": total_repos
            }
        }
    else:
        # For pages 2 and 3, we shouldn't reach here if frontend is caching properly
        # But if we do, return empty (frontend should use cache)
        print(f"[MATCHER] Warning: Page {page} requested but should use cached data")
        return {
            "recommendations": [],
            "gemini_response": "Please use cached results from page 1",
            "pagination": {
                "current_page": page,
                "total_pages": 0,
                "repos_per_page": repos_per_page,
                "total_repos": 0
            }
        }