def generate_recommendations(repos, issues_map):
    recommendations = []


    for repo in repos:
        key = repo["full_name"]
        recommendations.append({
        "name": repo["name"],
        "url": repo["html_url"],
        "stars": repo["stargazers_count"],
        "description": repo["description"],
        "issues": issues_map.get(key, [])
        })


    return recommendations