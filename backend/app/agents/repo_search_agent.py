from app.github_client import search_repositories
from datetime import datetime, timedelta, timezone
import re

def find_repos(persona):
    print(f"\n[REPO_SEARCH] Starting repository search")
    print(f"[REPO_SEARCH] Persona keys: {list(persona.keys())}")
    
    tech_stack = persona["stack"] if persona["stack"] else ["Python"]
    print(f"[REPO_SEARCH] Tech stack: {tech_stack}")
    
    # Use extracted keywords from keyword extraction agent (if available)
    # Otherwise fall back to simple extraction
    if "extracted_keywords" in persona and persona["extracted_keywords"]:
        interest_keywords = persona["extracted_keywords"]
        print(f"[REPO_SEARCH] Using extracted keywords: {interest_keywords}")
    else:
        # Fallback: simple keyword extraction
        interests_prompt = persona.get("interests", "") or "open source"
        print(f"[REPO_SEARCH] No extracted keywords found, using fallback extraction from: {interests_prompt}")
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'you', 'him', 'her', 'us', 'them', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'}
        words = re.findall(r'\b\w{3,}\b', interests_prompt.lower())
        interest_keywords = [word for word in words if word not in stop_words][:10]
        if not interest_keywords:
            interest_keywords = ["open source"]
        print(f"[REPO_SEARCH] Fallback keywords extracted: {interest_keywords}")
    
    # Normalize tech stack to lowercase for comparison
    tech_stack_lower = [tech.lower() for tech in tech_stack]
    
    all_repos = {}
    repo_scores = {}
    total_queries = 0
    total_repos_from_api = 0
    
    # Search for each interest keyword (without language restriction for broader results)
    # Then filter by languages in tech stack
    six_months_ago = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
    print(f"[REPO_SEARCH] Searching for repos updated after: {six_months_ago}")
    
    # Limit to first 5 keywords to reduce API calls and avoid rate limits
    limited_keywords = interest_keywords[:5]
    if len(interest_keywords) > 5:
        print(f"[REPO_SEARCH] Limiting to first 5 keywords to avoid rate limits: {limited_keywords}")
    
    for interest in limited_keywords:
        # Search with interest and filters for open source, active, non-archived repos
        # is:public ensures open source, archived:false excludes archived, has:issues ensures contributions possible
        # pushed:>YYYY-MM-DD filters for repos with commits in the last 6 months
        query = f"{interest}+is:public+archived:false+has:issues+pushed:>{six_months_ago}"
        print(f"[REPO_SEARCH] Query 1 (interest only): {query}")
        repos = search_repositories(query, per_page=50)
        total_queries += 1
        total_repos_from_api += len(repos)
        print(f"[REPO_SEARCH]   -> Found {len(repos)} repos from API")
    
        # Filter repos by languages in tech stack and score them
        for repo in repos:
            repo_id = repo["id"]
            repo_language = repo.get("language", "").lower() if repo.get("language") else ""
            
            # Check if repo language matches any in tech stack
            matches_language = any(
                tech == repo_language or 
                tech in repo_language or 
                repo_language in tech
                for tech in tech_stack_lower
            ) if repo_language else False
            
            # Include repos that match at least one language, or if no language specified
            # Also verify repo is open source and not archived (double-check)
            if (matches_language or not repo_language) and not repo.get("archived", False) and repo.get("private", False) == False:
                if repo_id not in all_repos:
                    all_repos[repo_id] = repo
                    repo_scores[repo_id] = 0
                
                # Score based on number of matching interests
                repo_scores[repo_id] += 1
                
                # Bonus for exact language match
                if repo_language in tech_stack_lower:
                    repo_scores[repo_id] += 0.5
        
        # Also search with explicit language filters for more precise matches
        for language in tech_stack:
            # Ensure open source, active, non-archived repos with issues enabled
            # Use same 6-month filter for recent activity
            query_with_lang = f"{interest}+language:{language}+is:public+archived:false+has:issues+pushed:>{six_months_ago}"
            print(f"[REPO_SEARCH] Query 2 (interest + language): {query_with_lang}")
            repos_lang = search_repositories(query_with_lang, per_page=50)
            total_queries += 1
            total_repos_from_api += len(repos_lang)
            print(f"[REPO_SEARCH]   -> Found {len(repos_lang)} repos from API")
            
            for repo in repos_lang:
                repo_id = repo["id"]
                # Verify repo is open source and not archived (double-check)
                if not repo.get("archived", False) and repo.get("private", False) == False:
                    if repo_id not in all_repos:
                        all_repos[repo_id] = repo
                        repo_scores[repo_id] = 0
                    
                    # Higher score for explicit language matches
                    repo_scores[repo_id] += 1.5
    
    print(f"[REPO_SEARCH] Total queries made: {total_queries}")
    print(f"[REPO_SEARCH] Total repos from API: {total_repos_from_api}")
    print(f"[REPO_SEARCH] Unique repos collected: {len(all_repos)}")
    
    # Filter out any archived or private repos and check for recent activity
    filtered_repos = []
    skipped_archived = 0
    skipped_private = 0
    skipped_old = 0
    skipped_no_date = 0
    
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    print(f"[REPO_SEARCH] Filtering repos updated after: {three_months_ago.strftime('%Y-%m-%d')}")
    
    for repo in all_repos.values():
        if repo.get("archived", False):
            skipped_archived += 1
            continue
        if repo.get("private", False) == True:
            skipped_private += 1
            continue
        
        # Check if repo has recent activity (updated in last 3 months)
        updated_at = repo.get("updated_at")
        if updated_at:
            try:
                # Parse the updated_at timestamp (GitHub returns ISO format with Z)
                updated_str = updated_at.replace('Z', '+00:00')
                updated_date = datetime.fromisoformat(updated_str)
                # Convert to UTC-aware datetime if needed
                if updated_date.tzinfo is None:
                    updated_date = updated_date.replace(tzinfo=timezone.utc)
                
                # Only include repos updated in the last 3 months
                if updated_date >= three_months_ago:
                    filtered_repos.append(repo)
                else:
                    skipped_old += 1
            except (ValueError, AttributeError, TypeError) as e:
                # If date parsing fails, include the repo anyway (better to include than exclude)
                print(f"[REPO_SEARCH] Warning: Could not parse updated_at for repo {repo.get('name', 'unknown')}: {e}")
                filtered_repos.append(repo)
        else:
            # If no updated_at, skip this repo (likely inactive)
            skipped_no_date += 1
            continue
    
    print(f"[REPO_SEARCH] Filtering results:")
    print(f"[REPO_SEARCH]   - Skipped archived: {skipped_archived}")
    print(f"[REPO_SEARCH]   - Skipped private: {skipped_private}")
    print(f"[REPO_SEARCH]   - Skipped old (>3 months): {skipped_old}")
    print(f"[REPO_SEARCH]   - Skipped no date: {skipped_no_date}")
    print(f"[REPO_SEARCH]   - Final filtered repos: {len(filtered_repos)}")
    
    # Sort repos by score (highest first), then by stars as tiebreaker
    sorted_repos = sorted(
        filtered_repos, 
        key=lambda r: (repo_scores.get(r["id"], 0), r.get("stargazers_count", 0)), 
        reverse=True
    )
    # Return up to 50 repos for ranking (enough for 3 pages of 12 + buffer)
    result = sorted_repos[:50]
    print(f"[REPO_SEARCH] Returning {len(result)} repos (top 50)")
    return result