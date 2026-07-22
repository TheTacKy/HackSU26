from app.github_client import get_all_open_issues


def _has_label(issue, target_label):
    labels = issue.get("labels", []) if isinstance(issue, dict) else []
    normalized_target = target_label.lower()
    return any(
        (label.get("name", "") or "").lower() == normalized_target
        for label in labels
        if isinstance(label, dict)
    )


def _prioritize_issues(issues, preferred_label, fallback_label):
    preferred = [issue for issue in issues if _has_label(issue, preferred_label)]
    fallback = [issue for issue in issues if _has_label(issue, fallback_label)]
    unlabeled = [
        issue for issue in issues
        if not _has_label(issue, preferred_label) and not _has_label(issue, fallback_label)
    ]
    return preferred + fallback + unlabeled




def fetch_issues(repo, experience):
    owner = repo["owner"]["login"]
    name = repo["name"]
    preferred_label = (
        "good first issue"
        if experience and experience.lower() in ["none", "none - first time contributor"]
        else "help wanted"
    )
    fallback_label = "help wanted" if preferred_label == "good first issue" else "good first issue"

    issues = get_all_open_issues(owner, name)
    prioritized_issues = _prioritize_issues(issues, preferred_label, fallback_label)

    # Ensure we return a list and limit to 5
    return prioritized_issues[:5] if isinstance(prioritized_issues, list) else []
