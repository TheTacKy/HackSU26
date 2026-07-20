from concurrent.futures import ThreadPoolExecutor, as_completed
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agents.issue_agent import fetch_issues
from app.agents.recommendation_agent import serialize_issues
from app.schemas import UserProfile, IssuesBatchRequest
from app.services.matcher_service import run_matcher


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["POST"],
    allow_headers=["content-type"],
)


@app.middleware("http")
async def log_request_time(request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    print(
        f"[HTTP] method={request.method} path={request.url.path} "
        f"status={response.status_code} total_time={time.perf_counter() - started:.4f}s"
    )
    return response


@app.post("/match")
def match(
    profile: UserProfile,
    include_issues: bool = True,
):
    return run_matcher(profile, include_issues=include_issues)


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
