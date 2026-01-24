def generate_recommendations(repos, issues_map):
    recommendations = []


    for repo in repos:
        recommendations.append({
        "name": repo["name"],
        "url": repo["html_url"],
        "stars": repo["stargazers_count"],
        "description": repo["description"],
        "languages": repo.get("language", "Unknown")
        })


    return recommendations