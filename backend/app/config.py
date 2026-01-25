from dotenv import dotenv_values
import os

# Load .env file directly (not from OS environment variables)
env_vars = dotenv_values(".env")
#GITHUB_TOKEN = env_vars.get("GITHUB_TOKEN")
# Use OS environment variable for GITHUB_TOKEN (not .env file)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
# Other keys still use .env file
OPENAI_API_KEY = env_vars.get("OPENAI_API_KEY")
