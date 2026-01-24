from app.github_client import search_repositories

def find_repos(persona):
    # Handle empty arrays with defaults
    language = persona["stack"][0] if persona["stack"] else "Python"
    interest = persona["interests"][0] if persona["interests"] else "open source"

    query = f"{interest}+language:{language}+stars:>200+pushed:>2024-01-01"
    return search_repositories(query)[:10]