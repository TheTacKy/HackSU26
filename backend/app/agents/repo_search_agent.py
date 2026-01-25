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
    
    # Use top 3 keywords for a single combined query to minimize API calls
    top_keywords = interest_keywords[:3] if len(interest_keywords) >= 3 else interest_keywords
    if len(interest_keywords) > 3:
        print(f"[REPO_SEARCH] Using top 3 keywords for single query: {top_keywords}")
    
    # Build a simpler query without parentheses to avoid abuse detection
    # Use the first keyword as primary, others as additional search terms
    primary_keyword = top_keywords[0] if top_keywords else "open source"
    
    # Get primary language from tech stack (use first one)
    primary_language = tech_stack[0] if tech_stack else None
    
    # Build simpler query: keyword + language + basic filters (no date filter in query, we filter post-fetch)
    # Remove date filter from query to avoid triggering abuse detection
    if primary_language:
        query = f"{primary_keyword}+language:{primary_language}+is:public+archived:false+has:issues"
    else:
        query = f"{primary_keyword}+is:public+archived:false+has:issues"
    
    # Add additional keywords as search terms (space-separated, GitHub will match any)
    if len(top_keywords) > 1:
        additional_terms = " ".join(top_keywords[1:])
        query = f"{query} {additional_terms}"
    
    print(f"[REPO_SEARCH] Single combined query: {query}")
    print(f"[REPO_SEARCH] Requesting 100 repos to ensure we get at least 12 after filtering...")
    
    # Make ONE API call requesting 100 repos (we'll filter down to 36, but need buffer for filtering)
    repos = search_repositories(query, per_page=100)
    print(f"[REPO_SEARCH] Single API call returned {len(repos)} repos")
    
    # Process repos and build scoring
    all_repos = {}
    repo_scores = {}
    
    for repo in repos:
        repo_id = repo["id"]
        repo_language = repo.get("language", "").lower() if repo.get("language") else ""
        
        # Skip archived/private repos
        if repo.get("archived", False) or repo.get("private", False) == True:
            continue
        
        # Check if repo language matches tech stack
        matches_language = any(
            tech == repo_language or 
            tech in repo_language or 
            repo_language in tech
            for tech in tech_stack_lower
        ) if repo_language else False
        
        # Include repos that match language or have no language specified
        if matches_language or not repo_language:
            if repo_id not in all_repos:
                all_repos[repo_id] = repo
                repo_scores[repo_id] = 0
            
            # Score based on keyword matches in name/description
            repo_name = repo.get("name", "").lower()
            repo_desc = (repo.get("description") or "").lower()
            repo_text = f"{repo_name} {repo_desc}"
            
            # Score based on keyword matches
            for keyword in top_keywords:
                if keyword.lower() in repo_text:
                    repo_scores[repo_id] += 1
            
            # Bonus for exact language match
            if repo_language in tech_stack_lower:
                repo_scores[repo_id] += 2
    
    print(f"[REPO_SEARCH] Unique repos collected: {len(all_repos)}")
    
    # Filter out any archived or private repos and check for recent activity
    filtered_repos = []
    skipped_archived = 0
    skipped_private = 0
    skipped_old = 0
    skipped_no_date = 0
    
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    print(f"[REPO_SEARCH] Filtering repos with commits pushed after: {six_months_ago.strftime('%Y-%m-%d')} (6 months)")
    
    for repo in all_repos.values():
        if repo.get("archived", False):
            skipped_archived += 1
            continue
        if repo.get("private", False) == True:
            skipped_private += 1
            continue
        
        # Check if repo has recent commits (pushed in last 6 months)
        # Use pushed_at instead of updated_at to ensure we only get repos with recent commits
        pushed_at = repo.get("pushed_at")
        if pushed_at:
            try:
                # Parse the pushed_at timestamp (GitHub returns ISO format with Z)
                pushed_str = pushed_at.replace('Z', '+00:00')
                pushed_date = datetime.fromisoformat(pushed_str)
                # Convert to UTC-aware datetime if needed
                if pushed_date.tzinfo is None:
                    pushed_date = pushed_date.replace(tzinfo=timezone.utc)
                
                # Only include repos with commits pushed in the last 6 months
                if pushed_date >= six_months_ago:
                    filtered_repos.append(repo)
                else:
                    skipped_old += 1
                    # Log old repos for debugging
                    repo_name = repo.get("full_name", repo.get("name", "unknown"))
                    days_old = (datetime.now(timezone.utc) - pushed_date).days
                    print(f"[REPO_SEARCH] Skipping {repo_name}: last commit {days_old} days ago")
            except (ValueError, AttributeError, TypeError) as e:
                # If date parsing fails, skip this repo (better to exclude than include old repos)
                print(f"[REPO_SEARCH] Warning: Could not parse pushed_at for repo {repo.get('name', 'unknown')}: {e}")
                skipped_no_date += 1
        else:
            # If no pushed_at, skip this repo (likely inactive or no commits)
            skipped_no_date += 1
            continue
    
    print(f"[REPO_SEARCH] Filtering results (commits in last 6 months):")
    print(f"[REPO_SEARCH]   - Skipped archived: {skipped_archived}")
    print(f"[REPO_SEARCH]   - Skipped private: {skipped_private}")
    print(f"[REPO_SEARCH]   - Skipped old commits (>6 months): {skipped_old}")
    print(f"[REPO_SEARCH]   - Skipped no pushed_at date: {skipped_no_date}")
    print(f"[REPO_SEARCH]   - Final filtered repos: {len(filtered_repos)}")
    
    # Sort repos by score (highest first), then by stars as tiebreaker
    sorted_repos = sorted(
        filtered_repos, 
        key=lambda r: (repo_scores.get(r["id"], 0), r.get("stargazers_count", 0)), 
        reverse=True
    )
    
    # Ensure we return at least 12 repos if available, up to 36
    # If we have 12+, return up to 36. If we have fewer, return all we have.
    if len(sorted_repos) >= 12:
        result = sorted_repos[:36]
    else:
        result = sorted_repos  # Return all available repos if less than 12
    
    print(f"[REPO_SEARCH] Returning {len(result)} repos (target: 36, minimum: 12)")
    return result