from app.github_client import search_repositories
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
import re

def find_repos(persona):
    tech_stack = persona["stack"] if persona["stack"] else ["Python"]
    
    # Use extracted keywords from keyword extraction agent (if available)
    if "extracted_keywords" in persona and persona["extracted_keywords"]:
        interest_keywords = persona["extracted_keywords"]
    else:
        # Fallback: simple keyword extraction
        interests_prompt = persona.get("interests", "") or "open source"
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'you', 'him', 'her', 'us', 'them', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'}
        words = re.findall(r'\b\w{3,}\b', interests_prompt.lower())
        interest_keywords = [word for word in words if word not in stop_words][:10]
        if not interest_keywords:
            interest_keywords = ["open source"]
    
    # Normalize tech stack to lowercase for comparison
    tech_stack_lower = [tech.lower() for tech in tech_stack]
    
    all_repos = {}
    repo_scores = {}
    total_queries = 0
    total_repos_from_api = 0
    
    # Search for each interest keyword (without language restriction for broader results)
    six_months_ago = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
    
    # Use top 3 keywords (most important) to maintain quality while reducing API calls
    top_keywords = interest_keywords[:3] if len(interest_keywords) >= 3 else interest_keywords
    
    # Build combined keyword query using OR operator
    # For multi-word keywords, wrap in quotes for exact phrase matching
    keyword_terms = []
    for keyword in top_keywords:
        if ' ' in keyword:
            keyword_terms.append(f'"{keyword}"')
        else:
            keyword_terms.append(keyword)
    
    # Combine with OR: "pokemon go" OR "augmented reality" OR "mobile games"
    combined_keywords = " OR ".join(keyword_terms)
    
    # Strategy: Make 1-2 queries per language instead of 2 queries per keyword
    # This reduces from 10+ calls to 3-4 calls while maintaining quality
    
    base_filters = f"is:public+archived:false+has:issues+pushed:>{six_months_ago}"
    query_specs = [("general", f"({combined_keywords})+{base_filters}", None)]
    query_specs.extend(
        ("language", f"({combined_keywords})+language:{language}+{base_filters}", language)
        for language in dict.fromkeys(tech_stack)
    )

    repos_general = []
    language_results = []

    with ThreadPoolExecutor(max_workers=min(4, len(query_specs))) as executor:
        future_to_spec = {
            executor.submit(search_repositories, query, 100): (query_type, language)
            for query_type, query, language in query_specs
        }

        for future in as_completed(future_to_spec):
            query_type, language = future_to_spec[future]
            repos_result = future.result()
            total_queries += 1
            total_repos_from_api += len(repos_result)

            if query_type == "general":
                repos_general = repos_result
            else:
                language_results.append((language, repos_result))
    
    # If combined OR query returns 0 results, try individual keyword queries as fallback
    if len(repos_general) == 0 and len(top_keywords) > 1:
        for keyword in top_keywords[:2]:  # Try top 2 keywords individually
            query_individual = f"{keyword}+{base_filters}"
            repos_individual = search_repositories(query_individual, per_page=50)
            total_queries += 1
            total_repos_from_api += len(repos_individual)
            
            # Process individual results
            for repo in repos_individual:
                repo_id = repo["id"]
                repo_language = repo.get("language", "").lower() if repo.get("language") else ""
                matches_language = any(
                    tech == repo_language or 
                    tech in repo_language or 
                    repo_language in tech
                    for tech in tech_stack_lower
                ) if repo_language else False
                
                if (matches_language or not repo_language) and not repo.get("archived", False) and repo.get("private", False) == False:
                    if repo_id not in all_repos:
                        all_repos[repo_id] = repo
                        repo_scores[repo_id] = 0
                    repo_scores[repo_id] += 2  # Score for individual keyword match
                    if repo_language in tech_stack_lower:
                        repo_scores[repo_id] += 2
    
    # Process general results and score them
    for repo in repos_general:
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
        if (matches_language or not repo_language) and not repo.get("archived", False) and repo.get("private", False) == False:
            if repo_id not in all_repos:
                all_repos[repo_id] = repo
                repo_scores[repo_id] = 0
            
            # Score based on keyword matches in name/description
            repo_name = (repo.get("name", "") or "").lower()
            repo_desc = (repo.get("description", "") or "").lower()
            repo_text = f"{repo_name} {repo_desc}"
            
            # Score based on how many keywords match
            keyword_matches = sum(1 for kw in top_keywords if kw.lower() in repo_text)
            repo_scores[repo_id] += keyword_matches
            
            # Bonus for exact language match
            if repo_language in tech_stack_lower:
                repo_scores[repo_id] += 2
    
    # Process language-specific searches
    for language, repos_lang in language_results:
        for repo in repos_lang:
            repo_id = repo["id"]
            # Verify repo is open source and not archived
            if not repo.get("archived", False) and repo.get("private", False) == False:
                if repo_id not in all_repos:
                    all_repos[repo_id] = repo
                    repo_scores[repo_id] = 0
                
                # Higher score for explicit language matches (these are more relevant)
                repo_scores[repo_id] += 3
                
                # Additional bonus for keyword matches in language-specific results
                repo_name = (repo.get("name", "") or "").lower()
                repo_desc = (repo.get("description", "") or "").lower()
                repo_text = f"{repo_name} {repo_desc}"
                keyword_matches = sum(1 for kw in top_keywords if kw.lower() in repo_text)
                repo_scores[repo_id] += keyword_matches
    
    # Filter out any archived or private repos and check for recent activity
    filtered_repos = []
    skipped_archived = 0
    skipped_private = 0
    skipped_old = 0
    skipped_no_date = 0
    
    three_months_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
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
                filtered_repos.append(repo)
        else:
            # If no updated_at, skip this repo (likely inactive)
            skipped_no_date += 1
            continue
    
    # Sort repos by score (highest first), then by stars as tiebreaker
    sorted_repos = sorted(
        filtered_repos, 
        key=lambda r: (repo_scores.get(r["id"], 0), r.get("stargazers_count", 0)), 
        reverse=True
    )
    # Return up to 50 repos for ranking (enough for 3 pages of 12 + buffer)
    result = sorted_repos[:50]
    return result
