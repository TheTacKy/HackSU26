from dotenv import dotenv_values
import os
from pathlib import Path

# Get the backend directory (parent of app directory)
# This ensures we find .env file in backend/ regardless of where script is run from
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"

# Load .env file directly (not from OS environment variables)
env_vars = dotenv_values(str(env_path))

GITHUB_TOKEN = env_vars.get("GITHUB_TOKEN")
OPENAI_API_KEY = env_vars.get("OPENAI_API_KEY")
GEMINI_API_KEY = env_vars.get("GEMINI_API_KEY")

# Debug: Log if token was loaded (without exposing the actual token)
if GITHUB_TOKEN:
    print(f"[CONFIG] Successfully loaded GITHUB_TOKEN from {env_path} (token length: {len(GITHUB_TOKEN)})")
else:
    print(f"[CONFIG] WARNING: GITHUB_TOKEN not found in {env_path}. Check that .env file exists and contains GITHUB_TOKEN=...")