from app.agents.profile_agent import build_persona
from app.agents.repo_search_agent import find_repos
from app.agents.issue_agent import fetch_issues
from app.agents.recommendation_agent import generate_recommendations
from app.agents.ranking_agent import rank_repos
from app.agents.keyword_extraction_agent import extract_keywords
from concurrent.futures import ThreadPoolExecutor, as_completed
import time




def run_matcher(profile, page=1):
    persona = build_persona(profile)
    
    # API Call 1: Extract keywords from interests using OpenAI
    interests_prompt = persona.get("interests", "") or "open source"
    print(f"\n[1st AI CALL] Extracting keywords from: '{interests_prompt[:60]}...'")
    start_time_1 = time.time()
    extracted_keywords = extract_keywords(interests_prompt)
    elapsed_1 = time.time() - start_time_1
    print(f"[1st AI CALL] Extracted keywords: {extracted_keywords} (took {elapsed_1:.2f}s)")
    
    # Add extracted keywords to persona for repo search
    persona["extracted_keywords"] = extracted_keywords
    
    # API Call 2: Search GitHub repositories
    print(f"\n[2nd GITHUB API CALL] Searching repositories...")
    start_time_2 = time.time()
    repos = find_repos(persona)
    elapsed_2 = time.time() - start_time_2
    print(f"[2nd GITHUB API CALL] Found {len(repos)} repositories (took {elapsed_2:.2f}s)")
    
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

    # API Call 3: Rank repositories using OpenAI
    print(f"\n[3rd AI CALL] Ranking {len(repos)} repositories...")
    start_time_3 = time.time()
    ranked_repos, gemini_response = rank_repos(repos, persona)
    elapsed_3 = time.time() - start_time_3
    
    # Ensure we have ranked repos (fallback to original if ranking failed)
    if not ranked_repos or len(ranked_repos) == 0:
        ranked_repos = repos
        if isinstance(gemini_response, str) and "No repositories to rank" in gemini_response:
            gemini_response = "Ranking unavailable, using original order"
    
    print(f"[3rd AI CALL] Ranking completed (took {elapsed_3:.2f}s)")

    # Pagination: 12 repos per page
    repos_per_page = 12
    
    # OPTIMIZATION: For page 1, return ALL repos (up to 50) so frontend can paginate client-side
    if page == 1:
        repos_to_process = ranked_repos[:50]
        issues_map = {}
        
        # Fetch issues in parallel
        print(f"\n[ISSUES] Fetching issues for {len(repos_to_process)} repos in parallel...")
        start_time_issues = time.time()
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_repo = {
                executor.submit(fetch_issues, repo, persona["experience"]): repo["full_name"]
                for repo in repos_to_process
            }
            
            for future in as_completed(future_to_repo):
                repo_name = future_to_repo[future]
                try:
                    issues_map[repo_name] = future.result()
                except Exception as e:
                    issues_map[repo_name] = []
        
        elapsed_issues = time.time() - start_time_issues
        print(f"[ISSUES] Fetched issues for {len(repos_to_process)} repos (took {elapsed_issues:.2f}s)")
        
        recommendations = generate_recommendations(repos_to_process, issues_map)
        total_repos = len(repos_to_process)
        total_pages = min(4, (total_repos + repos_per_page - 1) // repos_per_page)
        
        return {
            "recommendations": recommendations,
            "gemini_response": gemini_response,
            "pagination": {
                "current_page": 1,
                "total_pages": total_pages,
                "repos_per_page": repos_per_page,
                "total_repos": total_repos
            }
        }
    else:
        # For pages 2+, return empty - frontend should use cached results from page 1
        total_pages = max(1, (len(ranked_repos) + repos_per_page - 1) // repos_per_page)
        return {
            "recommendations": [],
            "gemini_response": "Please use cached results from page 1. If you need fresh results, request page 1 again.",
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "repos_per_page": repos_per_page,
                "total_repos": len(ranked_repos)
            }
        }