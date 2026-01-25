from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import UserProfile
from app.services.matcher_service import run_matcher


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
def match(profile: UserProfile, page: int = Query(1, ge=1, le=3)):
    """
    Match user profile with repositories.
    page: Page number (1-3), each page contains 12 repositories
    """
    return run_matcher(profile, page=page)