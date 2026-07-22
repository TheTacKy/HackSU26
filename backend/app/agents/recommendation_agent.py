def serialize_issues(issues):
    issues_list = []
    for issue in issues[:5]:
        if isinstance(issue, dict):
            issues_list.append({
                "title": issue.get("title", "No title"),
                "url": issue.get("html_url", ""),
                "number": issue.get("number", 0),
                "state": issue.get("state", "open")
            })
    return issues_list


def generate_recommendations(repos, issues_map):
    recommendations = []

    for repo in repos:
        repo_key = repo["full_name"]
        issues = issues_map.get(repo_key, [])
        issues_list = serialize_issues(issues)
        
        recommendations.append({
            "name": repo["name"],
            "full_name": repo.get("full_name", ""),
            "url": repo["html_url"],
            "stars": repo["stargazers_count"],
            "description": repo.get("description", "No description available"),
            "language": repo.get("language", "Unknown"),
            "topics": repo.get("topics", []),
            "issues": issues_list,
            "issues_count": len(issues_list)
        })

    return recommendations
