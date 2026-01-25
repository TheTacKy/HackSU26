from app.github_client import get_issues, get_all_open_issues




def fetch_issues(repo, experience):
    owner = repo["owner"]["login"]
    name = repo["name"]

    # Try to fetch issues with preferred label first
    # Check for various "none" representations (case-insensitive)
    label = "good first issue" if experience and experience.lower() in ["none", "none - first time contributor"] else "help wanted"
    issues = get_issues(owner, name, label)
    
    # If no issues found with preferred label, try alternative labels
    if not issues or len(issues) == 0:
        # Try the other label
        alternative_label = "help wanted" if label == "good first issue" else "good first issue"
        issues = get_issues(owner, name, alternative_label)
    
    # If still no issues, try fetching all open issues (without label filter)
    if not issues or len(issues) == 0:
        issues = get_all_open_issues(owner, name)
    
    # Ensure we return a list and limit to 5
    return issues[:5] if isinstance(issues, list) else []