from dotenv import dotenv_values

# Load .env file directly (not from OS environment variables)
env_vars = dotenv_values(".env")

GITHUB_TOKEN = env_vars.get("GITHUB_TOKEN")
OPENAI_API_KEY = env_vars.get("OPENAI_API_KEY")
GEMINI_API_KEY = env_vars.get("GEMINI_API_KEY")