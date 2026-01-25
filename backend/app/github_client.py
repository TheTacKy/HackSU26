import requests
import base64
from app.config import GITHUB_TOKEN


HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}




def search_repositories(query, per_page=50):
    """
    Search GitHub repositories.
    per_page: Number of results per page (max 100, default 30)
    """
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&per_page={per_page}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json().get("items", [])
    return []




def get_issues(owner, repo, label):
    url = f"https://api.github.com/repos/{owner}/{repo}/issues?labels={label}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        issues = response.json()
        # Ensure we return a list (GitHub API returns a list, but handle edge cases)
        return issues if isinstance(issues, list) else []
    return []




def get_readme(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        data = response.json()
        content = base64.b64decode(data['content']).decode('utf-8')
        return content
    return None




def get_code_breakdown(owner, repo, path=""):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return None