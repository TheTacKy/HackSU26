from fastapi import FastAPI
from app.schemas import UserProfile
from app.services.matcher_service import run_matcher


app = FastAPI()


@app.post("/match")
def match(profile: UserProfile):
    return run_matcher(profile)