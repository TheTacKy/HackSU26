from fastapi import FastAPI
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
def match(profile: UserProfile):
    return run_matcher(profile)