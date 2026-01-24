def build_persona(profile):
    return {
    "stack": profile.tech_stack,
    "level": profile.skill_level,
    "interests": profile.interests,
    "experience": profile.open_source_experience,
    "goal": profile.contribution_type
    }