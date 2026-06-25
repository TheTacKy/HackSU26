from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.schemas import UserProfile, IssuesBatchRequest
from app.services.matcher_service import run_matcher, run_matcher_with_options
from app.agents.issue_agent import fetch_issues
from app.agents.recommendation_agent import serialize_issues


app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.post("/match")
def match(
    profile: UserProfile,
    page: int = Query(1, ge=1, le=10),
    include_issues: bool = Query(True)
):
    """
    Match user profile with repositories.
    page: Page number for client-side cached pagination
    """
    if include_issues:
        return run_matcher(profile, page=page)
    return run_matcher_with_options(profile, page=page, include_issues=False)


@app.post("/issues/batch")
def batch_issues(request: IssuesBatchRequest):
    issues_map = {}
    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_repo = {}
        for full_name in request.repositories:
            if "/" not in full_name:
                issues_map[full_name] = []
                continue

            owner, name = full_name.split("/", 1)
            repo_stub = {
                "owner": {"login": owner},
                "name": name,
            }
            future_to_repo[executor.submit(fetch_issues, repo_stub, request.experience)] = full_name

        for future in as_completed(future_to_repo):
            full_name = future_to_repo[future]
            try:
                issues_map[full_name] = serialize_issues(future.result())
            except Exception:
                issues_map[full_name] = []

    return {"issues": issues_map}
