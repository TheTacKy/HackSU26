import requests
import base64
import time
from app.config import GITHUB_TOKEN


HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}

# Log GitHub token status
if GITHUB_TOKEN:
    print(f"[GITHUB_API] Using authenticated requests (token present)")
else:
    print(f"[GITHUB_API] WARNING: No GITHUB_TOKEN found. Using unauthenticated requests (60 req/hour limit)")




def search_repositories(query, per_page=50, max_retries=3):
    """
    Search GitHub repositories with rate limit and abuse detection handling.
    per_page: Number of results per page (max 100, default 30)
    max_retries: Maximum number of retries on rate limit
    """
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&per_page={per_page}"
    print(f"[GITHUB_API] Searching: {url}")
    
    for attempt in range(max_retries):
        response = requests.get(url, headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            total_count = data.get("total_count", 0)
            print(f"[GITHUB_API] Response: status=200, total_count={total_count}, items_returned={len(items)}")
            return items
        elif response.status_code == 403:
            # Rate limit exceeded
            error_data = response.json() if response.text else {}
            error_msg = error_data.get("message", "Rate limit exceeded")
            
            # Check if there's a retry-after header
            retry_after = response.headers.get("Retry-After")
            if retry_after:
                wait_time = int(retry_after) + 1
                print(f"[GITHUB_API] Rate limit exceeded. Waiting {wait_time} seconds before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
            else:
                # Default wait time if no retry-after header
                wait_time = (attempt + 1) * 10  # Exponential backoff
                print(f"[GITHUB_API] Rate limit exceeded. Waiting {wait_time} seconds before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
        elif response.status_code == 429:
            # Abuse detection mechanism triggered
            error_data = response.json() if response.text else {}
            error_msg = error_data.get("message", "Abuse detection mechanism triggered")
            print(f"[GITHUB_API] Abuse detection triggered: {error_msg}")
            
            # Wait longer for abuse detection (2-5 minutes)
            wait_time = 120 + (attempt * 60)  # 2 min, 3 min, 4 min
            print(f"[GITHUB_API] Waiting {wait_time} seconds before retry {attempt + 1}/{max_retries}...")
            time.sleep(wait_time)
            continue
        else:
            print(f"[GITHUB_API] Error: status={response.status_code}, response={response.text[:200]}")
            return []
    
    # All retries exhausted
    print(f"[GITHUB_API] Request failed after {max_retries} retries. Returning empty results.")
    return []




def get_issues(owner, repo, label):
    url = f"https://api.github.com/repos/{owner}/{repo}/issues?labels={label}&state=open&per_page=10"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        issues = response.json()
        # Filter out pull requests (GitHub API returns both issues and PRs)
        # PRs have a 'pull_request' key, issues don't
        issues_only = [issue for issue in issues if 'pull_request' not in issue]
        # Ensure we return a list (GitHub API returns a list, but handle edge cases)
        return issues_only if isinstance(issues_only, list) else []
    return []


def get_all_open_issues(owner, repo):
    """Fetch all open issues without label filter"""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues?state=open&per_page=10"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        issues = response.json()
        # Filter out pull requests (GitHub API returns both issues and PRs)
        # PRs have a 'pull_request' key, issues don't
        issues_only = [issue for issue in issues if 'pull_request' not in issue]
        return issues_only if isinstance(issues_only, list) else []
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