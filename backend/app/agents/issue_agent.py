from app.github_client import get_issues




def fetch_issues(repo, experience):
    owner = repo["owner"]["login"]
    name = repo["name"]

    # Check for various "none" representations (case-insensitive)
    label = "good first issue" if experience and experience.lower() in ["none", "none - first time contributor"] else "help wanted"
    issues = get_issues(owner, name, label)
    # Ensure we return a list and limit to 5
    return issues[:5] if isinstance(issues, list) else []