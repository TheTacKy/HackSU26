import openai
from app.config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY

def rank_repos(repos, persona):
    prompt = f"Rank repos for persona: {persona}.\nRepos: {[r['name'] for r in repos]}"

    res = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
    )

    return res.choices[0].message.content