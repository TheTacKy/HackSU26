from dotenv import dotenv_values
from pathlib import Path

env_path = Path(__file__).parent.parent / ".env"
env_vars = dotenv_values(env_path)

GITHUB_TOKEN = env_vars.get("GITHUB_TOKEN")
OPENAI_API_KEY = env_vars.get("OPENAI_API_KEY")
