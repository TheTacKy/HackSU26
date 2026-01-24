import requests
from app.config import GITHUB_TOKEN


HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}




def search_repositories(query):
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars"
    return requests.get(url, headers=HEADERS).json().get("items", [])




def get_issues(owner, repo, label):
    url = f"https://api.github.com/repos/{owner}/{repo}/issues?labels={label}"
    return requests.get(url, headers=HEADERS).json()