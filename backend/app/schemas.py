from pydantic import BaseModel
from typing import List


class UserProfile(BaseModel):
    name: str
    tech_stack: List[str]
    skill_level: str
    interests: str  # Changed from List[str] to str for prompt-based input
    open_source_experience: str
    occupation: str
    contribution_type: str