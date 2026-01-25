def build_persona(profile):
    return {
    "name": profile.name,
    "stack": profile.tech_stack,
    "level": profile.skill_level,
    "interests": profile.interests,
    "experience": profile.open_source_experience,
    "occupation": profile.occupation,
    "goal": profile.contribution_type
    }