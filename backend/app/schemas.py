from pydantic import BaseModel
from typing import List, Optional


class UserProfile(BaseModel):
    name: str
    tech_stack: List[str]
    interests: str  # Changed from List[str] to str for prompt-based input
    skill_level: str
    open_source_experience: str
    occupation: Optional[str] = None
    contribution_type: Optional[str] = None