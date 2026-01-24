from app.github_client import get_issues




def fetch_issues(repo, experience):
    owner = repo["owner"]["login"]
    name = repo["name"]


    label = "good first issue" if experience == "None" else "help wanted"
    return get_issues(owner, name, label)[:5]