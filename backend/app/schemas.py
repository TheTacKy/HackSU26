from pydantic import BaseModel
class UserProfile(BaseModel):
    tech_stack: list[str]
    interests: str
    skill_level: str
    open_source_experience: str


class IssuesBatchRequest(BaseModel):
    repositories: list[str]
    experience: str
