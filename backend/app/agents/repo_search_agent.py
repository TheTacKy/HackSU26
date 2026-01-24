from app.github_client import search_repositories

def find_repos(persona):
    language = persona["stack"][0]
    interest = persona["interests"][0]


    query = f"{interest}+language:{language}+stars:>200+pushed:>2024-01-01"
    return search_repositories(query)[:10]