from app.github_client import search_repositories

def find_repos(persona):
    tech_stack = persona["stack"] if persona["stack"] else ["Python"]
    interests = persona["interests"] if persona["interests"] else ["open source"]
    
    # Normalize tech stack to lowercase for comparison
    tech_stack_lower = [tech.lower() for tech in tech_stack]
    
    all_repos = {}
    repo_scores = {}
    
    # Search for each interest (without language restriction for broader results)
    # Then filter by languages in tech stack
    for interest in interests:
        # Search with interest and basic filters
        query = f"{interest}+stars:>200+pushed:>2024-01-01"
        repos = search_repositories(query)
        
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
            if matches_language or not repo_language:
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
            query_with_lang = f"{interest}+language:{language}+stars:>200+pushed:>2024-01-01"
            repos_lang = search_repositories(query_with_lang)
            
            for repo in repos_lang:
                repo_id = repo["id"]
                if repo_id not in all_repos:
                    all_repos[repo_id] = repo
                    repo_scores[repo_id] = 0
                
                # Higher score for explicit language matches
                repo_scores[repo_id] += 1.5
    
    # Sort repos by score (highest first), then by stars as tiebreaker
    sorted_repos = sorted(
        all_repos.values(), 
        key=lambda r: (repo_scores.get(r["id"], 0), r.get("stargazers_count", 0)), 
        reverse=True
    )
    return sorted_repos[:10]