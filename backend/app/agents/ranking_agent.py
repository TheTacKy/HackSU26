import re
import time

import openai

from app.config import OPENAI_API_KEY


def _parse_ranking(text, repo_count):
    indices = [int(value) for value in re.findall(r"\d+", text)]
    valid = list(dict.fromkeys(index for index in indices if index < repo_count))
    return valid + [index for index in range(repo_count) if index not in valid]


def rank_repos(repos, persona):
    if not repos:
        return [], "No repositories to rank"
    if not OPENAI_API_KEY:
        return repos, "OPENAI_API_KEY not found"

    interests = persona.get("interests") or "Not specified"
    tech_stack = ", ".join(persona.get("stack", []))
    profile = (
        f"Tech: {tech_stack} | Level: {persona.get('level', 'N/A')} | "
        f"Interests: {interests} | Experience: {persona.get('experience', 'N/A')}"
    )
    repo_lines = []
    for index, repo in enumerate(repos):
        description = (repo.get("description") or "No description")[:200]
        topics = ", ".join((repo.get("topics") or [])[:5]) or "None"
        repo_lines.append(
            f"{index}. {repo.get('name', 'Unknown')} | {repo.get('language') or 'Unknown'} | "
            f"{repo.get('stargazers_count', 0)} stars | {description} | {topics}"
        )

    prompt = f"""Rank these GitHub repositories for this contributor.

Profile: {profile}

Repositories:
{chr(10).join(repo_lines)}

Prioritize interest match, then tech stack match, then skill fit.
Return every index exactly once as comma-separated numbers, best first. No other text."""
    client = openai.OpenAI(api_key=OPENAI_API_KEY)

    for attempt in range(3):
        started = time.time()
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Return only comma-separated repository indices."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            text = response.choices[0].message.content.strip()
            order = _parse_ranking(text, len(repos))
            print(f"[OPENAI_API] repo_ranking time={time.time() - started:.2f}s")
            return [repos[index] for index in order], text
        except openai.RateLimitError as error:
            retry_after = getattr(error, "retry_after", None)
            if attempt == 2 or retry_after is None:
                return repos, f"OpenAI rate limit exceeded: {error}"
            time.sleep(float(retry_after) + 1)
        except openai.AuthenticationError:
            return repos, "OPENAI_API_KEY is invalid"
        except openai.APIError as error:
            return repos, f"OpenAI API error: {error}"

    return repos, "Ranking unavailable"
