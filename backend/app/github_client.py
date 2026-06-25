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


def _timed_get(url, *, headers=None, timeout=None, label="request"):
    start_time = time.time()
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        elapsed = time.time() - start_time
        print(
            f"[GITHUB_API] {label} -> status={response.status_code} "
            f"time={elapsed:.2f}s"
        )
        return response
    except requests.Timeout:
        elapsed = time.time() - start_time
        print(f"[GITHUB_API] {label} -> timeout after {elapsed:.2f}s")
        raise
    except Exception as exc:
        elapsed = time.time() - start_time
        print(f"[GITHUB_API] {label} -> failed after {elapsed:.2f}s: {exc}")
        raise




def search_repositories(query, per_page=50, max_retries=3):
    """
    Search GitHub repositories with rate limit handling.
    per_page: Number of results per page (max 100, default 30)
    max_retries: Maximum number of retries on rate limit
    """
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&per_page={per_page}"
    
    for attempt in range(max_retries):
        response = _timed_get(
            url,
            headers=HEADERS,
            label=f"search_repositories attempt={attempt + 1}/{max_retries}"
        )
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            total_count = data.get("total_count", 0)
            remaining = response.headers.get("X-RateLimit-Remaining", "unknown")
            limit = response.headers.get("X-RateLimit-Limit", "unknown")
            print(f"  -> Found {len(items)} repos (total: {total_count}, rate limit: {remaining}/{limit})")
            return items
        elif response.status_code == 403:
            # Rate limit exceeded
            error_data = response.json() if response.text else {}
            error_msg = error_data.get("message", "Rate limit exceeded")
            
            # Check if there's a retry-after header
            retry_after = response.headers.get("Retry-After")
            if retry_after:
                wait_time = int(retry_after) + 1
                print(f"  -> Rate limit exceeded. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
            else:
                # Default wait time if no retry-after header
                wait_time = (attempt + 1) * 10  # Exponential backoff
                print(f"  -> Rate limit exceeded. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                continue
        else:
            print(f"  -> Error: status={response.status_code}")
            return []
    
    # All retries exhausted
    print(f"  -> Rate limit exceeded after {max_retries} retries. Returning empty results.")
    return []




def get_issues(owner, repo, label, timeout=5):
    """
    Fetch issues with a label. Added timeout to prevent hanging.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/issues?labels={label}&state=open&per_page=10"
    try:
        response = _timed_get(
            url,
            headers=HEADERS,
            timeout=timeout,
            label=f"get_issues repo={owner}/{repo} label='{label}'"
        )
        if response.status_code == 200:
            issues = response.json()
            # Filter out pull requests (GitHub API returns both issues and PRs)
            # PRs have a 'pull_request' key, issues don't
            issues_only = [issue for issue in issues if 'pull_request' not in issue]
            # Ensure we return a list (GitHub API returns a list, but handle edge cases)
            return issues_only if isinstance(issues_only, list) else []
        return []
    except requests.Timeout:
        return []
    except Exception as e:
        return []


def get_all_open_issues(owner, repo, timeout=5):
    """Fetch all open issues without label filter. Added timeout to prevent hanging."""
    url = f"https://api.github.com/repos/{owner}/{repo}/issues?state=open&per_page=20&sort=updated&direction=desc"
    try:
        response = _timed_get(
            url,
            headers=HEADERS,
            timeout=timeout,
            label=f"get_all_open_issues repo={owner}/{repo}"
        )
        if response.status_code == 200:
            issues = response.json()
            # Filter out pull requests (GitHub API returns both issues and PRs)
            # PRs have a 'pull_request' key, issues don't
            issues_only = [issue for issue in issues if 'pull_request' not in issue]
            return issues_only if isinstance(issues_only, list) else []
        return []
    except requests.Timeout:
        return []
    except Exception as e:
        return []




def get_readme(owner, repo):
    url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    response = _timed_get(url, headers=HEADERS, label=f"get_readme repo={owner}/{repo}")
    if response.status_code == 200:
        data = response.json()
        content = base64.b64decode(data['content']).decode('utf-8')
        return content
    return None




def get_code_breakdown(owner, repo, path=""):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    response = _timed_get(
        url,
        headers=HEADERS,
        label=f"get_code_breakdown repo={owner}/{repo} path='{path or '/'}'"
    )
    if response.status_code == 200:
        return response.json()
    return None
