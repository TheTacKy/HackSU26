from pydantic import BaseModel
from typing import List


class UserProfile(BaseModel):
    name: str
    tech_stack: List[str]
    skill_level: str
    interests: List[str]
    open_source_experience: str
    occupation: str
    contribution_type: str